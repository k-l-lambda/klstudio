
call	svn	export --force	"https://github.com/k-l-lambda/klstudio/trunk/WebSites/K.L. Studio/trunk/WebRoot"	"%KLSTUDIO_PUBLISH_DIR%"

call	"deploy non-svn files.bat"	"%KLSTUDIO_PUBLISH_DIR%"

pause
