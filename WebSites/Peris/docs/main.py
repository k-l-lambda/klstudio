
import sys
import os
import web
import logging
import datetime
import md5
import re

sys.path.append(os.path.dirname(__file__))

import config
import Serializer


db = web.database(host='127.0.0.1', dbn='mysql', user=config.db_user, pw=config.db_password, db='peris')


def renderTemplate(template):
	return open(os.path.dirname(__file__) + '/templates/' + template, 'r').read()


class HomeHandle:
	def GET(self):
		yield	renderTemplate('Home.html')


class AdminHomeHandle:
	def GET(self):
		yield	renderTemplate('AdminHome.html')


class FileRegister:
	@staticmethod
	def lookupByPath(path):
		record = db.select('file_register', where = 'path=$path', vars = dict(path = path))
		record = len(record) > 0 and record[0] or None

		return record


class DbQueryHandle:
	def GET(self):
		return DbQueryHandle.POST(self)

	def POST(self):
		input = web.input()
		sql = input.sql

		web.header('Content-Type', 'application/json')

		try:
			data = db.query(sql)
			return Serializer.save({'result': 'success', 'data': data})
		except:
			logging.warn('sql query error: %s', sys.exc_info())
			return Serializer.save({'result': 'fail', 'error': str(sys.exc_info()[1])})


class ConstantsHandle:
	def GET(self):

		web.header('Content-Type', 'text/javascript')

		yield '''
			constants = constants || {}
		'''


class UpdateFileRegisterHandle:
	def POST(self):
		yield '<link href="/static/console.css" rel="stylesheet" type="text/css">'
		yield '<p>Scan directory <em>%s</em> ...</p>' % config.data_root

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
								try:
									file = file.decode('utf-8')
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

					relpath = os.path.relpath(path, config.data_root).replace('\\', '/')

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

		yield '<p>End.</p>'


class ImportAlbumDataHandle:
	def POST(self):
		input = web.input(id = None)

		yield '<head>'
		yield '<link href="/static/console.css" rel="stylesheet" type="text/css">'
		yield '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
		yield '</head>'

		labels = {}

		yield '<p>Read label file <em>%s</em> ...<p>' % input.LabelFile
		labelFile = open(input.LabelFile, 'r')
		labelFile.read(3)	# skip unicode head
		for line in labelFile:
			fields = line.split("|")
			labels[fields[0]] = fields[1]
			#yield '<p>%s, %s</p>' % (fields[0], fields[1])

		yield '<p>Read data file <em>%s</em> ...<p>' % input.File
		dataFile = open(input.File, 'r')
		dataFile.read(3)	# skip unicode head
		for line in dataFile:
			try:
				fields = line.replace('\n', '').split("|")
				path = input.PathPrefix + fields[0].decode('utf-8')

				registery = FileRegister.lookupByPath(path)
				if registery is None:
					yield '<p class="error">Cannot find file in register: <em>%s</em></p>' % path
				else:
					hash = registery.hash

					score = float(fields[1])

					label = ''
					if input.Label:
						label += input.Label + '|'
					if fields[2] == '1':
						label += 'SM|'
					if fields[3] == '1':
						label += 'SE|'
					if fields[4]:
						if not labels.has_key(fields[4]):
							yield '<p class="error">No label of %s</p>' % fields[4]
						else:
							label += labels[fields[4]] + '|'

					label = re.sub('(\|)$', '', label)

					record = db.select('album', where = 'hash=$hash', vars = dict(hash = hash))
					record = record and record[0]

					if record:
						db.update('album', where = 'hash=$hash', vars = dict(hash = hash), score = score, labels = label)

						yield '<p class="update"><strong>%s</strong>: <em>%s</em>, %f, %s</p>' % (path, hash, score, label.decode('utf-8'))
					else:
						db.insert('album', hash = hash, score = score, labels = label)

						yield '<p class="new"><strong>%s</strong>: <em>%s</em>, %f, %s</p>' % (path, hash, score, label.decode('utf-8'))
			except:
				yield '<p class="error">Error when proess <em>%s</em>: <strong>%s</strong></p>' % (line, sys.exc_info())

		yield '<p>End.</p>'



application = web.application((
	'/',								'HomeHandle',
	'/query',							'DbQueryHandle',
	'/constants.js',					'ConstantsHandle',
	'/admin/',							'AdminHomeHandle',
	'/admin/update-file-register',		'UpdateFileRegisterHandle',
	'/admin/import-album-data',			'ImportAlbumDataHandle',
	), globals()).wsgifunc()
