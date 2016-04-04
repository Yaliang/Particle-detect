import csv
import math
import random
from btree import bTree
from pca import pca

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
			i = len(self.ranking) - 1
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
					d[t] = r[1]['__size__']
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
		self.train_bTree = bTree()
	def add(self, data):
		d = {}
		for i, a in enumerate(self.attr):
			d[a] = int(data[i])
		d[self.target] = int(data[-1])
		d['__size__'] = 1
		self.train.append(d)
		self.train_bTree.insert([d[a] for a in self.attr], d)
	def load(self, filename):
		with open(filename,'rb') as csvfile:
			rdr = csv.reader(csvfile)
			header = rdr.next()
			self.attr = header[:-1]
			self.target = header[-1]
			for row in rdr:
				self.add(row)
	def train_bTree_to_list(self):
		self.train = self.train_bTree.inorder()
	def classify(self, d, attr = None):
		"""
		find the class for an object 'd'.
		"""
		if not attr:
			attr = self.attr
		res = self.result(self.target, self.k)
		for t in self.train:
			dis = 0
			for a in attr:
				dis += (t[a] - d[a])*(t[a] - d[a])
			dis = math.sqrt(dis)
			res.insert(dis, t)
		return res.vote()

	def test_unit(self, i, attr = None):
		if self.classify(self.train[i], attr) == self.train[i][self.target]:
			# print i, 'True'
			return True
		else:
			print i, 'False', self.train[i][self.target]
			return False

	def random_test(self, size, attr = None):
		test_i = random.sample(range(len(self.train)), size)
		correct = 0
		error = 0
		for i in test_i:
			if self.test_unit(i, attr):
				correct += 1
			else:
				error += 1
		print correct, error
		return correct, error
