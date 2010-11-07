
import types
import string


def save(data):
    t = type(data)
    if t is types.ListType:
        return '{%s}' % string.join([save(elem) for elem in data], ',')
    elif t in [types.StringType, types.UnicodeType]:
        return '"%s"' % data
    elif t is types.BooleanType:
        return data and 'true' or 'false'
    elif t is types.NoneType:
        return 'nil'
    elif t in [types.IntType, types.LongType, types.FloatType]:
        return str(data)
    else:
        raise RuntimeError('unsupported type: %s' % t)
