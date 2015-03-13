
call	svn	export --force	"https://github.com/k-l-lambda/klstudio/trunk/WebSites/K.L. Studio/trunk/Source"	"..\release"
call	"deploy non-svn files.bat"	"..\release\static"

appcfg.py --email=xxxk.l.xxx@gmail.com update "..\\release\\"

pause
