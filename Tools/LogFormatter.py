import re


logRegex = re.compile('(\d+\.\d+\.\d+\.\d+) (\S*) (\S*) \[(.*?)\] "([A-Z]+ ([\S]+?) [^"]*?)" (\d+) (\d+) (.*?)\n\t(\d+\:[\d\.]+) (.*?)\n', re.S)

def formatLog(source):
    lines = logRegex.finditer(source)

    result = ''
    for line in lines:
        for item in line.groups():
            item = item.replace('\n', ' ')
            item = item.replace('\r', ' ')
            item = item.replace('\t', ' ')
            result += item + '\t'
        result += '\n'
        #print(result)

    return result


f = open('server.log', 'r')
text = f.read()
f.close()

result = formatLog(text)
f = open('server.log.txt', 'w')
f.writelines(result)
f.close()
