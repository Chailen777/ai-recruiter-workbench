Set shell = CreateObject("WScript.Shell")
root = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
bat = root & "\start-dev.bat"
shell.Run """" & bat & """", 2, False
