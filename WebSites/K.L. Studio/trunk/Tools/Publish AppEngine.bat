
call	svn	export --force	"https://klstudio.googlecode.com/svn/WebSites/K.L. Studio/trunk/WebRoot"	"%KLSTUDIO_PUBLISH_DIR_AE%\HTML"
call	"deploy non-svn files.bat"	"%KLSTUDIO_PUBLISH_DIR_AE%\HTML"

appcfg.py --email=xxxk.l.xxx@gmail.com update "%KLSTUDIO_PUBLISH_DIR_AE%\\"

pause
