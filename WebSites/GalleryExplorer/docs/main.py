
import sys
import os
import web
import logging
import datetime
import re
import cgi
import traceback
import StringIO
import glob
import shutil

sys.path.append(os.path.dirname(__file__))

import config
import Serializer


def renderTemplate(template):
	return open(os.path.dirname(__file__) + '/templates/' + template, 'r').read()


class HomeHandle:
	def GET(self):
		return renderTemplate('Home.html')


class DirectoryHandle:
	def GET(self):
		input = web.input()

		root = os.path.join(config.data_root, input.root)
		items = os.listdir(root)

		dirs = filter(lambda x: os.path.isdir(os.path.join(root, x)), items)
		files = filter(lambda x: os.path.isfile(os.path.join(root, x)), items)

		return Serializer.save({'dirs': dirs, 'files': files})


application = web.application((
	'/',								'HomeHandle',
	'/dir',								'DirectoryHandle',
	), globals()).wsgifunc()
