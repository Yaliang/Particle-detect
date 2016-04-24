import csv
import math
import random

class knn(object):
	"""
	The class to operate KNN algorithm
	"""
	class result(object):
		"""
		The class to fill the result of a classification
		"""
		def __init__(self, target, k = 30):
			self.ranking = []
			self.k = k
			self.target = target
		def insert(self, key, data):
			"""
			Insert the new key value and the original data
			into the ranking list
			"""
			self.ranking.append((key, data))
			if len(self.ranking) > self.k:
				i = len(self.ranking)-1
				while i>1 and self.ranking[i][0] < self.ranking[i-1][0]:
					self.ranking[i-1] = self.ranking[i]
					i -= 1
				while len(self.ranking) > self.k:
					self.ranking.pop()
		def vote(self):
			"""
			Vote the major class in the top K ranking elements
			"""
			d = {}
			for r in self.ranking:
				t = r[1][self.target]
				if t in d:
					d[t] += r[1]['__size__']
				else:
					d[t] = 0
			max_class = None
			max_vote = 0
			for t in d:
				if max_vote < d[t]:
					max_vote = d[t]
					max_class = t
			return max_class
	def __init__(self, k = 30):
		self.train = []
		self.k = k
	def reduce(self):
		for i,d in enumerate(self.train):
			for j,t in enumerate(self.train):
				pass
	def margin(self, data):
		f = False
		for d in self.train:
			f = True
			for a in self.attr:
				if d[a] != data[a]:
					f = False
					break
			if f and d[self.target] != data[self.target]:
				f = False
			if f:
				d['__size__'] += data['__size__']
				break
		if not f:
			self.train.append(data)
	def add(self, data):
		d = {}
		for i, a in enumerate(self.attr):
			d[a] = int(data[i])
		d[self.target] = int(data[-1])
		d['__size__'] = 1
		self.train.append(d)
	def load(self, filename):
		with open(filename,'rb') as csvfile:
			rdr = csv.reader(csvfile)
			header = rdr.next()
			self.attr = header[:-1]
			self.target = header[-1]
			for row in rdr:
				self.add(row)
	def classify(self, d):
		res = self.result(self.target, self.k)
		for t in self.train:
			dis = 0
			for a in self.attr:
				dis += (t[a] - d[a])*(t[a] - d[a])
			dis = math.sqrt(dis)
			res.insert(dis, t)
		return res.vote()

	def test_unit(self, i):
		if self.classify(self.train[i]) == self.train[i][self.target]:
			print i, 'True'
			return True
		else:
			print i, 'False'
			return False

	def random_test(self, size):
		test_i = random.sample(range(len(self.train)), size)
		correct = 0
		error = 0
		for i in test_i:
			if self.test_unit(i):
				correct += 1
			else:
				error += 1
		print correct, error
		return correct, error
