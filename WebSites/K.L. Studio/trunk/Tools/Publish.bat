
call	svn	export --force	"https://klstudio.googlecode.com/svn/WebSites/K.L. Studio/trunk/WebRoot"	"%KLSTUDIO_PUBLISH_DIR%"

call	"deploy non-svn files.bat"	"%KLSTUDIO_PUBLISH_DIR%"

pause
