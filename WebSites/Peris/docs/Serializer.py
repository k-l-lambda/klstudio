
import types
import string
import datetime
import web

from django.utils import simplejson


class PlainText:
	def __init__(self, value):
		self.value = value

	def __str__(self):
		return self.value


def normalizeData(data):
	t = type(data)
	if t is types.ListType or isinstance(data, web.utils.IterBetter):
		return map(lambda elem: normalizeData(elem), data)
	elif t is types.DictType or t is web.utils.Storage:
		return dict(map(lambda elem: (elem, normalizeData(data[elem])), data))
	elif t is types.DictType \
		or (t in [types.StringType, types.UnicodeType]) \
		or t is types.BooleanType \
		or t is types.NoneType \
		or t in [types.IntType, types.LongType, types.FloatType]:
		return data
	elif isinstance(data, PlainText):
		return unicode(data)
	elif isinstance(data, datetime.datetime):
		return str(data)
		return {'nickname': data.nickname(), 'email': data.email(), 'user_id': data.user_id()}
	else:
		raise RuntimeError('unsupported type: %s' % t)


def save(data):
	return simplejson.dumps(normalizeData(data))


def saveTuple(*datas):
	return tuple([save(d) for d in datas])
