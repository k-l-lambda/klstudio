
call	svn	export --force	"https://klstudio.googlecode.com/svn/WebSites/K.L. Studio/trunk/Source"	"..\release"
call	"deploy non-svn files.bat"	"..\release\static"

appcfg.py --email=xxxk.l.xxx@gmail.com update "..\\release\\"

pause
