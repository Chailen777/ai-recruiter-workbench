'use client'

import Link from 'next/link'

import { CandidateCard, CompanyCard, JobCard, PaginatedCardList } from '@/components/ui'

/* ---------- serialisable types for client components ---------- */
type CompanyRow = {
  id: number
  name: string
  industry: string | null
  city: string | null
  address: string | null
  cooperationStatus: string | null
  companyContactName: string | null
  companyContactPhone: string | null
  jobsCount: number
  note: string | null
}

type JobRow = {
  id: number
  title: string
  salaryRange: string | null
  commission: string | null
  city: string | null
  educationRequirement: string | null
  experienceRequirement: string | null
  headcount: number | null
  companyName: string
  status: string
  skillKeywords: string | null
  jobCategory: string | null
  link: string | null
}

type CandidateRow = {
  id: number
  name: string
  gender: string | null
  avatar: string | null
  city: string | null
  age: number | null
  education: string | null
  yearsOfWork: number | null
  expectedSalary: string | null
  currentCompany: string | null
  currentTitle: string | null
  schoolName: string | null
  major: string | null
  selfIntro: string | null
  skillTags: string | null
  tags: string | null
  status: string
  createdAt: string
  updatedAt: string
}

type Props = {
  companies: CompanyRow[]
  jobs: JobRow[]
  candidates: CandidateRow[]
}

export function SearchCards({ companies, jobs, candidates }: Props) {
  return (
    <>
      {companies.length > 0 && (
        <PaginatedCardList
          items={companies}
          pageSize={8}
          renderItem={(c) => (
            <CompanyCard
              id={c.id}
              name={c.name}
              industry={c.industry}
              city={c.city}
              address={c.address}
              cooperationStatus={c.cooperationStatus}
              companyContactName={c.companyContactName}
              companyContactPhone={c.companyContactPhone}
              jobsCount={c.jobsCount}
              note={c.note}
            />
          )}
          title={`企业 (${companies.length})`}
        />
      )}

      {jobs.length > 0 && (
        <PaginatedCardList
          items={jobs}
          pageSize={8}
          renderItem={(j) => (
            <Link
              href={`/jobs?jobId=${j.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <JobCard
                id={j.id}
                title={j.title}
                salaryRange={j.salaryRange}
                commission={j.commission}
                city={j.city}
                educationRequirement={j.educationRequirement}
                experienceRequirement={j.experienceRequirement}
                headcount={j.headcount}
                companyName={j.companyName}
                status={j.status}
                skillKeywords={j.skillKeywords}
                jobCategory={j.jobCategory}
                link={j.link}
              />
            </Link>
          )}
          title={`岗位 (${jobs.length})`}
        />
      )}

      {candidates.length > 0 && (
        <PaginatedCardList
          items={candidates}
          pageSize={8}
          renderItem={(c) => (
            <CandidateCard
              id={c.id}
              name={c.name}
              gender={c.gender}
              avatar={c.avatar}
              city={c.city}
              age={c.age}
              education={c.education}
              yearsOfWork={c.yearsOfWork}
              expectedSalary={c.expectedSalary}
              currentCompany={c.currentCompany}
              currentTitle={c.currentTitle}
              schoolName={c.schoolName}
              major={c.major}
              selfIntro={c.selfIntro}
              skillTags={c.skillTags}
              tags={c.tags}
              status={c.status}
              createdAt={c.createdAt}
              updatedAt={c.updatedAt}
            />
          )}
          title={`候选人 (${candidates.length})`}
        />
      )}
    </>
  )
}
