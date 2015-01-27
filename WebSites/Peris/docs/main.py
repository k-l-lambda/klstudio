
import sys
import os
import web
import logging
import datetime
import md5

sys.path.append(os.path.dirname(__file__))

import config


db = web.database(host='127.0.0.1', dbn='mysql', user=config.db_user, pw=config.db_password, db='peris')


class HomeHandle:
	def GET(self):
		yield	'<h1>Peris</h1>'
		yield	'<form action="update-file-register" method="post" target="_blank"><input type="submit" value="Update FileRegister" /></form>'


class UpdateFileRegisterHandle:
	def POST(self):
		yield '<link href="/static/console.css" rel="stylesheet" type="text/css">'
		for root, dirs, files in os.walk(config.data_root):
			for file in files:
				try:
					file = file.decode('gb2312')
				except:
					try:
						file = file.decode('euc_jp')
					except:
						try:
							file = file.decode('iso2022_jp')
						except:
							try:
								file = file.decode('big5')
							except:
								yield '<p class="error">Failed to decode <em>%s / %s</em>: <strong>%s</strong></p>' % (root, file, sys.exc_info())
								continue

				path = os.path.join(root, file)
				try:
					modify_time = None
					try:
						modify_time = datetime.datetime.fromtimestamp(os.path.getmtime(path)).replace(microsecond=0)
					except:
						modify_time = datetime.datetime.now()

					relpath = os.path.relpath(path, config.data_root)

					record = db.select('file_register', where = 'path=$path', vars = dict(path = relpath))
					record = record and record[0]
					if record and record.date == modify_time:
						continue

					hash = md5.md5(open(path, 'rb').read()).hexdigest()

					if record:
						db.update('file_register', where = 'path=$path', vars = dict(path = relpath), hash = hash, date = modify_time)

						yield '<p class="update"><em>%s</em> [%s -> %s]</p>' % (relpath, record and record.date or 'null', modify_time)
					else:
						db.insert('file_register', path = relpath, hash = hash, date = modify_time)

						yield '<p class="new"><em>%s</em></p>' % relpath
				except:
					yield '<p class="error">Error when proess <em>%s</em>: <strong>%s</strong></p>' % (path, sys.exc_info())

		yield 'End.'

application = web.application((
	'/',							'HomeHandle',
	'/update-file-register',		'UpdateFileRegisterHandle',
	), globals()).wsgifunc()
