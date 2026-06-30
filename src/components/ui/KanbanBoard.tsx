'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Types ──

export interface KanbanCard {
  id: string
  title: string
  subtitle?: string
  tag?: string
  score?: number
  /** If set, double-click navigates to /candidates?id={candidateId} */
  candidateId?: number
}

export interface KanbanColumn {
  id: string
  label: string
  color: string
  items: KanbanCard[]
}

export interface KanbanBoardProps {
  columns: KanbanColumn[]
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void
  onCardDelete?: (cardId: string, columnId: string) => void
  /** Column IDs that should NOT accept incoming drags (e.g. terminal states) */
  restrictedDropColumns?: string[]
}

// ── Status color mapping ──

const COLUMN_COLORS: Record<string, { bg: string; dot: string; border: string }> = {
  screening: { bg: 'color-mix(in srgb, var(--ds-color-primary, #2563eb) 6%, var(--ds-color-card, #fff))', dot: 'var(--ds-color-primary, #2563eb)', border: 'color-mix(in srgb, var(--ds-color-primary, #2563eb) 18%, var(--ds-color-border, #e5e7eb))' },
  interview: { bg: 'color-mix(in srgb, var(--ds-color-warning, #f59e0b) 6%, var(--ds-color-card, #fff))', dot: 'var(--ds-color-warning, #f59e0b)', border: 'color-mix(in srgb, var(--ds-color-warning, #f59e0b) 18%, var(--ds-color-border, #e5e7eb))' },
  offer: { bg: 'color-mix(in srgb, var(--ds-color-success, #16a34a) 6%, var(--ds-color-card, #fff))', dot: 'var(--ds-color-success, #16a34a)', border: 'color-mix(in srgb, var(--ds-color-success, #16a34a) 18%, var(--ds-color-border, #e5e7eb))' },
  hired: { bg: 'color-mix(in srgb, var(--ds-color-purple, #8b5cf6) 6%, var(--ds-color-card, #fff))', dot: 'var(--ds-color-purple, #8b5cf6)', border: 'color-mix(in srgb, var(--ds-color-purple, #8b5cf6) 18%, var(--ds-color-border, #e5e7eb))' },
  rejected: { bg: 'color-mix(in srgb, #ef4444 6%, var(--ds-color-card, #fff))', dot: '#ef4444', border: 'color-mix(in srgb, #ef4444 18%, var(--ds-color-border, #e5e7eb))' },
  expired: { bg: 'color-mix(in srgb, #78716c 6%, var(--ds-color-card, #fff))', dot: '#78716c', border: 'color-mix(in srgb, #78716c 18%, var(--ds-color-border, #e5e7eb))' },
}

// ── Sortable Card ──

const SortableCard = memo(function SortableCard({
  card,
  columnId,
  onDoubleClick,
  onDelete,
}: {
  card: KanbanCard
  columnId: string
  onDoubleClick?: (card: KanbanCard) => void
  onDelete?: (card: KanbanCard) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { columnId } })

  // Extract sortable's event handlers — cast to proper React types
  // (DnD Kit's SyntheticListenerMap uses Function types that TS flags as incompatible)
  const sortablePointerDown = listeners?.onPointerDown as unknown as
    | React.PointerEventHandler<HTMLDivElement>
    | undefined
  const sortableKeyDown = listeners?.onKeyDown as unknown as
    | React.KeyboardEventHandler<HTMLDivElement>
    | undefined
  const lastClick = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Double-click detection FIRST — if hit, skip drag initiation
      const now = Date.now()
      if (now - lastClick.current < 360 && onDoubleClick) {
        lastClick.current = 0
        onDoubleClick(card)
        e.preventDefault()
        return
      }
      lastClick.current = now
      // Single click — let DnD Kit handle potential drag
      sortablePointerDown?.(e)
    },
    [card, onDoubleClick, sortablePointerDown]
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
  }

  return (
    <div
      className="kanban-card"
      ref={setNodeRef}
      style={style}
      {...attributes}
      tabIndex={(listeners?.tabIndex as unknown as number) ?? 0}
      role={(listeners?.role as unknown as string) ?? 'button'}
      aria-describedby={
        listeners?.['aria-describedby'] as unknown as string | undefined
      }
      aria-roledescription={
        listeners?.['aria-roledescription'] as unknown as string | undefined
      }
      onPointerDown={handlePointerDown}
      onKeyDown={sortableKeyDown}
      title={card.candidateId ? '双击查看候选人详情' : undefined}
    >
      {onDelete && (
        <button
          className="kanban-card-delete"
          title="移除卡片"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(card)
          }}
          type="button"
          aria-label={`删除 ${card.title}`}
        >
          ×
        </button>
      )}
      <div className="kanban-card-body">
        <strong className="kanban-card-title">{card.title}</strong>
        {card.subtitle && <p className="kanban-card-subtitle">{card.subtitle}</p>}
      </div>
      <div className="kanban-card-meta">
        {card.tag && <span className="kanban-card-tag">{card.tag}</span>}
        {card.score !== undefined && (
          <span className="kanban-card-score">
            {card.score} 分
          </span>
        )}
      </div>
    </div>
  )
})

// ── Column ──

const KanbanColumnView = memo(function KanbanColumnView({
  column,
  restricted,
  onCardDoubleClick,
  onCardDelete,
}: {
  column: KanbanColumn
  restricted: boolean
  onCardDoubleClick?: (card: KanbanCard) => void
  onCardDelete?: (card: KanbanCard) => void
}) {
  const colors = COLUMN_COLORS[column.id] ?? COLUMN_COLORS.screening

  // Register column body as a droppable target so empty columns can receive drops
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    disabled: restricted,
  })

  return (
    <div className="kanban-column" data-restricted={restricted ? '' : undefined}>
      <div className="kanban-column-head">
        <span
          className="kanban-column-dot"
          style={{ background: colors.dot }}
        />
        <strong className="kanban-column-label">{column.label}</strong>
        <span className="kanban-column-count">{column.items.length}</span>
        {restricted && <span className="kanban-column-lock" title="此列不可拖入">🔒</span>}
      </div>
      <div
        ref={setDroppableRef}
        className="kanban-column-body"
        style={{
          background: isOver ? `color-mix(in srgb, ${colors.dot} 12%, ${colors.bg})` : colors.bg,
          borderColor: isOver ? colors.dot : colors.border,
          borderStyle: isOver ? 'solid' : undefined,
        }}
      >
        <SortableContext
          items={column.items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.items.length > 0 ? (
            column.items.map((card) => (
              <SortableCard
                card={card}
                columnId={column.id}
                key={card.id}
                onDoubleClick={onCardDoubleClick}
                onDelete={onCardDelete}
              />
            ))
          ) : (
            <div className="kanban-column-empty">
              {column.id === 'screening'
                ? '新增候选人自动进入'
                : restricted
                  ? '终态列 · 不可拖入'
                  : '拖拽卡片至此列'}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
})

// ── Drag Overlay Card (clone shown during drag) ──

const DragCard = memo(function DragCard({ card }: { card: KanbanCard }) {
  return (
    <div className="kanban-card kanban-card-dragging">
      <div className="kanban-card-body">
        <strong className="kanban-card-title">{card.title}</strong>
        {card.subtitle && <p className="kanban-card-subtitle">{card.subtitle}</p>}
      </div>
      <div className="kanban-card-meta">
        {card.tag && <span className="kanban-card-tag">{card.tag}</span>}
        {card.score !== undefined && (
          <span className="kanban-card-score">{card.score} 分</span>
        )}
      </div>
    </div>
  )
})

// ── Board ──

export const KanbanBoard = memo(function KanbanBoard({
  columns: initialColumns,
  onCardMove,
  onCardDelete,
  restrictedDropColumns = [],
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // Build a flat map of cardId → columnId for lookup
  const cardColumnMap = useMemo(() => {
    const map = new Map<string, string>()
    columns.forEach((col) => col.items.forEach((card) => map.set(card.id, col.id)))
    return map
  }, [columns])

  const findColumnByCardId = useCallback(
    (cardId: string) => cardColumnMap.get(cardId) ?? null,
    [cardColumnMap]
  )

  const handleCardDoubleClick = useCallback(
    (card: KanbanCard) => {
      if (card.candidateId) {
        router.push(`/candidates?id=${card.candidateId}`)
      }
    },
    [router]
  )

  const handleCardDelete = useCallback(
    (card: KanbanCard) => {
      const colId = findColumnByCardId(card.id)
      setColumns((prev) =>
        prev.map((col) =>
          col.id === colId
            ? { ...col, items: col.items.filter((i) => i.id !== card.id) }
            : col
        )
      )
      onCardDelete?.(card.id, colId ?? '')
    },
    [findColumnByCardId, onCardDelete]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const cardId = active.id as string
      const colId = findColumnByCardId(cardId)
      if (!colId) return
      const col = columns.find((c) => c.id === colId)
      const card = col?.items.find((i) => i.id === cardId)
      if (card) setActiveCard(card)
    },
    [columns, findColumnByCardId]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveCard(null)
      if (!over) return

      const cardId = active.id as string
      const fromColId = findColumnByCardId(cardId)
      if (!fromColId) return

      // Determine target column
      let toColId: string | null = null

      // Check if over is a column droppable (prefixed with "column-")
      if (typeof over.id === 'string' && over.id.startsWith('column-')) {
        toColId = over.id.slice(7) // Remove "column-" prefix
      } else {
        const toCol = columns.find((c) => c.id === over.id)
        if (toCol) {
          toColId = toCol.id
        } else {
          // over is a card — find its column
          toColId = findColumnByCardId(over.id as string)
        }
      }

      if (!toColId) return

      // No-op if same column
      if (fromColId === toColId) return

      // ── Restricted drop columns check ──
      if (restrictedDropColumns.includes(toColId)) return

      // Move card
      setColumns((prev) => {
        const next = prev.map((col) => ({ ...col, items: [...col.items] }))
        const fromCol = next.find((c) => c.id === fromColId)
        const toCol = next.find((c) => c.id === toColId)
        if (!fromCol || !toCol) return prev

        const cardIndex = fromCol.items.findIndex((i) => i.id === cardId)
        if (cardIndex === -1) return prev

        const [card] = fromCol.items.splice(cardIndex, 1)
        toCol.items.push(card)

        onCardMove?.(cardId, fromColId, toColId)
        return next
      })
    },
    [columns, findColumnByCardId, onCardMove, restrictedDropColumns]
  )

  const restrictedSet = useMemo(
    () => new Set(restrictedDropColumns),
    [restrictedDropColumns]
  )

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      sensors={sensors}
    >
      <div className="kanban-board">
        {columns.map((col) => (
          <KanbanColumnView
            column={col}
            key={col.id}
            restricted={restrictedSet.has(col.id)}
            onCardDoubleClick={handleCardDoubleClick}
            onCardDelete={handleCardDelete}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? <DragCard card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
})
