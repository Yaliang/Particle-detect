import random
import matplotlib.pyplot as plt

class transform(object):
	def __init__(self, attr, w):
		self.w = w
		self.attr = attr
	def transform(self, data):
		ret = []
		for d in data:
			ret.append(sum([self.w[a] * d[a] for a in self.attr]))
		return ret

class pca(object):
	def __init__(self):
		pass
	def oja(self, data, attr, r = 0.9, eps = 0.0000001):
		w = {a:random.random() for a in attr}
		e = eps+1
		i = 0
		u_list = []
		while e > eps:
			old_w = {a: w[a] for a in attr}
			i += 1
			u = None
			for d in data:
				y = sum([w[a]*d[a] for a in attr])
				u = 1.0 / (y*y) if not u else 1.0 / (r/u+y*y)
				u_list.append(u)
				w = {a: w[a]+u*(y*d[a] - y*y*w[a]) for a in attr}
			e = max([abs(old_w[a] - w[a]) for a in attr])
			print e
			plt.plot(u_list)
			plt.show()
		print 'Finished in ', i , 'episodes'
		return transform(attr, w)