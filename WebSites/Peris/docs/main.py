
import sys
import os
import web
import logging
import datetime
import md5
import re
import cgi
import traceback
import StringIO
import glob
import shutil
from PIL import Image

sys.path.append(os.path.dirname(__file__))

import config
import Serializer
import Fingerprint16


imageFilePattern = re.compile('.*\.(jpg|jpeg|jpe|png|bmp|gif|webp)$')

db = web.database(host='127.0.0.1', dbn='mysql', user=config.db_user, pw=config.db_password, db='peris')


def renderTemplate(template):
	return open(os.path.dirname(__file__) + '/templates/' + template, 'r').read()


def getImageDate(path):
	try:
		exif = Image.open(path)._getexif()
		if exif:
			time_str = exif.get(36867) or exif.get(306)
			if time_str:
				taken_time = datetime.datetime.strptime(time_str, '%Y:%m:%d %H:%M:%S')
				if taken_time:
					return taken_time
	except:
		pass

	try:
		modify_time = datetime.datetime.fromtimestamp(os.path.getmtime(path)).replace(microsecond=0)
		if modify_time:
			return modify_time
	except:
		pass

	return datetime.datetime.now()


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
		web.header('Content-Type', 'application/json')

		input = web.input(sql = None, query = None)

		try:
			data = None

			if input.sql:
				data = DbQueryHandle.generalQuery(input.sql)
			elif input.query == 'file-info':
				data = DbQueryHandle.fileInfo(input)

			return Serializer.save({'result': 'success', 'data': data})
		except:
			logging.warn('sql query error: %s', sys.exc_info())
			return Serializer.save({'result': 'fail', 'error': ''.join(traceback.format_exception(*sys.exc_info()))})

	@staticmethod
	def generalQuery(sql):
		return db.query(sql)

	@staticmethod
	def fileInfo(input):
		if input.path:
			register = db.select('file_register', where = 'path=$path', vars = dict(path = input.path))
			register = register and register[0]
			if not register:
				return None

			info = {'path': input.path, 'hash': register.hash, 'date': register.date}

			cbir = db.select('cbir', where = 'hash=$hash', vars = dict(hash = register.hash))
			cbir = cbir and cbir[0]

			if cbir:
				info['thumb'] = cbir.thumb

			figure = db.select('album', where = 'hash=$hash', vars = dict(hash = register.hash))
			figure = figure and figure[0]

			if figure:
				info = dict(info.items() + {'score': figure.score, 'tags': figure.tags}.items())

			return info


class DbCbir:
	@staticmethod
	def updateFile(path, hash = None):
		hash = hash or md5.md5(open(path, 'rb').read()).hexdigest()

		record = db.select('cbir', where = 'hash=$hash', vars = dict(hash = hash))
		record = record and record[0]

		if not record:
			thumb = Fingerprint16.fileFingerprint(path)
			size = Image.open(path).size
			db.insert('cbir', hash = hash, thumb = thumb, width = size[0], height = size[1])

			return 'created'
		elif not record.thumb or not record.width or not record.height:
			if not record.thumb:
				db.update('cbir', where = 'hash=$hash', vars = dict(hash = hash), thumb = thumb)

			if not record.width or not record.height:
				size = Image.open(path).size
				db.update('cbir', where = 'hash=$hash', vars = dict(hash = hash), width = size[0], height = size[1])

			return 'updated'

		return 'ignored'

	@staticmethod
	def query(hash):
		record = db.select('cbir', where = 'hash=$hash', vars = dict(hash = hash))
		record = record and record[0]

		if record:
			return {'thumb': record.thumb}

		return None

class ConstantsHandle:
	def GET(self):

		web.header('Content-Type', 'text/javascript')

		yield '''
			constants = constants || {};
			constants.python_version = "%(ver)s";
			constants.python_path = %(path)s;
			constants.python_ospath = '%(ospath)s';
		''' % {
			'ver': sys.version,
			'path': sys.path,
			'ospath': os.environ['PATH'].replace('\\', '\\\\'),
		}


def decodeUnicode(str):
	try:
		str = str.decode('gbk')
	except:
		try:
			str = str.decode('euc_jp')
		except:
			try:
				str = str.decode('iso2022_jp')
			except:
				try:
					str = str.decode('big5')
				except:
					str = str.decode('utf-8')

	return str


class UpdateFileRegisterHandle:
	def POST(self):
		input = web.input(updateAll = False)

		yield '<head>'
		yield '<link href="/static/console.css" rel="stylesheet" type="text/css">'
		yield '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
		yield '</head>'

		yield '<p>Fetching all files path ...</p>'

		records = db.select('file_register', what = 'path')
		pathSet = set([r.path for r in records])

		yield '<p>Files count in file_register: <em>%d</em></p>' % len(pathSet)

		yield '<p>Scan directory <em>%s</em> ...</p>' % config.data_root

		for root, dirs, files in os.walk(config.data_root):
			for file in files:
				try:
					root = decodeUnicode(root)
					file = decodeUnicode(file)
				except:
					yield '<p class="error">Failed to decode <em>%s / %s</em>: <strong>%s</strong></p>' % (root, file, sys.exc_info())
					#continue

				if imageFilePattern.match(file, re.I):
					try:
						path = os.path.join(root, file)
						date = getImageDate(path)

						relpath = os.path.relpath(path, config.data_root).replace('\\', '/')

						if relpath in pathSet:
							pathSet.remove(relpath)

						record = db.select('file_register', where = 'path=$path', vars = dict(path = relpath))
						record = record and record[0]
						if not input.updateAll and record and record.date == date:
							continue

						hash = md5.md5(open(path, 'rb').read()).hexdigest()

						DbCbir.updateFile(path, hash)

						identityFile = db.select('file_register', where = 'hash=$hash', vars = dict(hash = hash))
						identityFile = identityFile and identityFile[0]

						duplicated = (identityFile and identityFile.path != relpath) and ('(duplicated with <em>%s</em>)' % identityFile.path) or ''

						if record:
							db.update('file_register', where = 'path=$path', vars = dict(path = relpath), hash = hash, date = date)

							yield '<p class="update"><em>%s</em> [%s -> %s] %s</p>' % (relpath, record and record.date or 'null', date, duplicated)
						else:
							db.insert('file_register', path = relpath, hash = hash, date = date)

							yield u'<p class="new"><em>%s</em> %s</p>' % (relpath, duplicated)
					except:
						yield u'<p class="error">Error when proess <em>%s / %s</em>: <strong>%s</strong></p>' % (root, file, sys.exc_info())

		yield '<p>Removing non-existent files...</p>'

		for path in pathSet:
			db.delete('file_register', where = 'path=$path', vars = dict(path = path))
			yield '<p class="remove"><em>%s</em></p>' % path

		yield '<p>End.</p>'


class FilterNewFiles:
	def POST(self):
		input = web.input(sourceDir = None, targetDir = config.data_root)

		input.targetDir = input.targetDir or config.data_root

		yield '<head>'
		yield '<link href="/static/console.css" rel="stylesheet" type="text/css">'
		yield '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
		yield '</head>'

		yield '<p><em>%s</em> -> <em>%s</em></p>' % (input.sourceDir, input.targetDir)

		for root, dirs, files in os.walk(input.sourceDir):
			for file in files:
				try:
					root = decodeUnicode(root)
					file = decodeUnicode(file)
				except:
					yield '<p class="error">Failed to decode <em>%s / %s</em>: <strong>%s</strong></p>' % (root, file, sys.exc_info())
					#continue

				if imageFilePattern.match(file, re.I):
					try:
						path = os.path.join(root, file)

						relpath = os.path.relpath(path, input.sourceDir).replace('\\', '/')

						hash = md5.md5(open(path, 'rb').read()).hexdigest()

						identityFile = db.select('file_register', where = 'hash=$hash', vars = dict(hash = hash))
						identityFile = identityFile and identityFile[0]

						if identityFile:
							yield u'<p class="duplicated"><em>%s</em> duplicated with <em>%s</em>: <span class="trivial">%s</span></p>' % (relpath, identityFile.path, hash)
						else:
							targetPath = os.path.join(input.targetDir, file)
							if os.path.isfile(targetPath):
								name, ext = os.path.splitext(file)
								targetPath = os.path.join(input.targetDir, '%s %s%s' % (name, datetime.datetime.now().strftime('%Y%m%dT%H%M%S'), ext))

							shutil.copy(path, targetPath)

							yield u'<p class="new"><em>%s</em>: <span class="trivial">%s</span>. copied to <em>%s</em></p>' % (relpath, hash, targetPath)
					except:
						yield u'<p class="error">Error when proess <em>%s / %s</em>: <strong>%s</strong></p>' % (root, file, sys.exc_info())

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

					tag = ''
					if input.Label:
						tag += input.Label + '|'
					if fields[2] == '1':
						tag += 'SM|'
					if fields[3] == '1':
						tag += 'SE|'
					if fields[4]:
						if not labels.has_key(fields[4]):
							yield '<p class="error">No tag of %s</p>' % fields[4]
						else:
							tag += labels[fields[4]] + '|'

					tag = re.sub('(\|)$', '', tag)

					record = db.select('album', where = 'hash=$hash', vars = dict(hash = hash))
					record = record and record[0]

					if record:
						db.update('album', where = 'hash=$hash', vars = dict(hash = hash), score = score, tags = tag)

						yield '<p class="update"><strong>%s</strong>: <em>%s</em>, %f, %s</p>' % (path, hash, score, tag.decode('utf-8'))
					else:
						db.insert('album', hash = hash, score = score, tags = tag)

						yield '<p class="new"><strong>%s</strong>: <em>%s</em>, %f, %s</p>' % (path, hash, score, tag.decode('utf-8'))
			except:
				yield '<p class="error">Error when proess <em>%s</em>: <strong>%s</strong></p>' % (line, sys.exc_info())

		yield '<p>End.</p>'


class UpdateFigureHandle:
	def POST(self):
		web.header('Content-Type', 'application/json')

		try:
			input = web.input(score = None, tags = None)
			hash = input.hash

			if not hash:
				return Serializer.save({'result': 'fail', 'error': 'hash is empty.'})

			data = {}
			if not input.score is None:
				data['score'] = input.score
			if not input.tags is None:
				data['tags'] = input.tags

			record = db.select('album', where = 'hash=$hash', vars = dict(hash = hash))
			record = record and record[0]

			if record:
				db.update('album', where = 'hash=$hash', vars = dict(hash = hash), **data)

				return Serializer.save({'result': 'success', 'type': 'update'})
			else:
				data.setdefault('score', None)
				data.setdefault('tags', None)

				db.insert('album', hash = hash, **data)

				return Serializer.save({'result': 'success', 'type': 'insert'})
		except:
			logging.warn('figure update error: %s', sys.exc_info())
			return Serializer.save({'result': 'fail', 'error': ''.join(traceback.format_exception(*sys.exc_info()))})


class ExecHandle:
	def POST(self):
		web.header('Content-Type', 'application/json')

		try:
			input = web.input(byExec = False)
			command = input.command.format(data_root = config.data_root)

			ret = None
			if input.byExec:
				exec command
			else:
				ret = eval(command)

			return Serializer.save({'result': 'success', 'command': command, 'ret': ret})
		except:
			logging.warn('Exec command error: %s', traceback.format_exception(*sys.exc_info()))
			return Serializer.save({'result': 'fail', 'error': ''.join(traceback.format_exception(*sys.exc_info()))})

	#def GET(self):
	#	return self.POST()


class CheckFileHandle:
	def POST(self):
		web.header('Content-Type', 'application/json')

		try:
			input = web.input()
			full_path = config.data_root + input.path

			if os.path.isfile(full_path):
				record = db.select('file_register', where = 'path=$path', vars = dict(path = input.path))
				record = record and record[0]

				date = getImageDate(full_path)

				hash = md5.md5(open(full_path, 'rb').read()).hexdigest()

				DbCbir.updateFile(full_path, hash)

				identityFile = db.select('file_register', where = 'hash=$hash', vars = dict(hash = hash))
				identityFile = identityFile and identityFile[0]

				duplicated = (identityFile and identityFile.path != input.path) and identityFile.path or None

				cbir = DbCbir.query(hash)
				thumb = cbir and cbir['thumb'] or None

				if record and record.date == date:
					return Serializer.save({'success': True, 'result': 'ignore', 'path': input.path, 'data': {'hash': hash, 'date': date, 'thumb': thumb }, 'description': 'file exists, register up to date.'})

				if record:
					db.update('file_register', where = 'path=$path', vars = dict(path = input.path), hash = hash, date = date)
					return Serializer.save({'success': True, 'result': 'update', 'path': input.path, 'description': 'File exists, register updated.', 'data': {'hash': hash, 'date': date, 'thumb': thumb }, 'duplicated': duplicated})
				else:
					db.insert('file_register', path = input.path, hash = hash, date = date)
					return Serializer.save({'success': True, 'result': 'insert', 'path': input.path, 'description': 'File exists, register inserted.', 'data': {'hash': hash, 'date': date, 'thumb': thumb}, 'duplicated': duplicated})
			else:
				ret = db.delete('file_register', where = 'path=$path', vars = dict(path = input.path))
				return Serializer.save({'success': True, 'result': 'delete', 'path': input.path, 'description': 'file non-existent, removed %d register(s).' % ret})
		except:
			logging.warn('Check file error: %s', traceback.format_exception(*sys.exc_info()))
			return Serializer.save({'success': False, 'path': input.path, 'error': ''.join(traceback.format_exception(*sys.exc_info()))})


class FingerprintHandle:
	def POST(self):
		return self.GET()

	def GET(self):
		web.header('Content-Type', 'application/json')

		try:
			data = web.data()
			stream = StringIO.StringIO(data)
			fingerprint = Fingerprint16.fileFingerprint(stream)

			return Serializer.save({'result': 'success', 'fingerprint': fingerprint})
		except:
			logging.warn('Calculate fingerprint error: %s', traceback.format_exception(*sys.exc_info()))
			return Serializer.save({'result': 'fail', 'error': ''.join(traceback.format_exception(*sys.exc_info()))})


class ListDirHandle:
	def GET(self):
		web.header('Content-Type', 'application/json')

		try:
			input = web.input(dir = '*\\*', orderby = None)

			search_dir = os.path.join(config.data_root, input.dir)
			files = filter(lambda f: os.path.isfile(f) and imageFilePattern.match(f), glob.glob(search_dir))

			if input.orderby == 'ctime':
				files.sort(key = lambda x: os.path.getctime(x))
			elif input.orderby == '-ctime':
				files.sort(key = lambda x: -os.path.getctime(x))
			elif input.orderby == 'mtime':
				files.sort(key = lambda x: os.path.getmtime(x))
			elif input.orderby == '-mtime':
				files.sort(key = lambda x: -os.path.getmtime(x))

			files = [decodeUnicode(os.path.relpath(f, config.data_root).replace('\\', '/')) for f in files]

			return Serializer.save({'success': True, 'files': files})
		except:
			logging.warn('List directory error: %s', traceback.format_exception(*sys.exc_info()))
			return Serializer.save({'success': False, 'error': ''.join(traceback.format_exception(*sys.exc_info()))})


application = web.application((
	'/',								'HomeHandle',
	'/constants.js',					'ConstantsHandle',
	'/query',							'DbQueryHandle',
	'/update-figure',					'UpdateFigureHandle',
	'/exec',							'ExecHandle',
	'/check-file',						'CheckFileHandle',
	'/fingerprint',						'FingerprintHandle',
	'/list-dir',						'ListDirHandle',
	'/admin/',							'AdminHomeHandle',
	'/admin/update-file-register',		'UpdateFileRegisterHandle',
	'/admin/import-album-data',			'ImportAlbumDataHandle',
	'/admin/filter-new-files',			'FilterNewFiles',
	), globals()).wsgifunc()
