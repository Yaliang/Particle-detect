def keyComp(l1, l2):
	"""
	if l1 > l2: return 1
	if l1 = l2: return 0
	if l1 < l2: return -1
	"""
	if type(l1) != type(l2):
		return None
	if type(l1) == int or type(l1) == float or type(l1) == str:
		# when the key is int / float / string
		if l1 == l2:
			return 0
		elif l1 < l2:
			return -1
		else:
			return 1
	elif type(l1) == list:
		# when the key is a list
		i = 0
		while i < len(l1):
			if i >= len(l2):
				return 1
			else:
				if l1[i] > l2[i]:
					return 1
				elif l1[i] < l2[i]:
					return -1
			i += 1
		if i < len(l2):
			return -1
		return 0
	else:
		return None

class treenode(object):
	"""
	The class for the balanced binary search tree to speed the searching and insert or ordering operations
	"""
	def __init__(self, key, data = None):
		"""
		Constructor of the node class, the key is the comparing parameter(s)
		'size' is the size of the subtree
		'duplication' is the duplication of the same node
		'data' is the original data saved in the node
		'left' and 'right' are its children
		"""
		self.key = key
		self.size = 1
		self.duplication = [1]
		self.data = [data]
		self.left = None
		self.right = None

	def leftTurn(self):
		"""
		Make a left turn at the self position and return the new root
		"""
		## switch the structure of the tree
		new_root = self.right
		self.right = new_root.left
		new_root.left = self
		## maintain the size of the node in subtree
		self.size -= new_root.size
		self.size += self.right.size if self.right else 0
		new_root.size -= self.right.size if self.right else 0
		new_root.size += self.size
		return new_root

	def rightTurn(self):
		"""
		Make a right turn at the self position and return the new root
		"""
		## switch the structure of the tree
		new_root = self.left
		self.left = new_root.right
		new_root.right = self
		## maintain the size of the node in subtree
		self.size -= new_root.size
		self.size += self.left.size if self.left else 0
		new_root.size -= self.left.size if self.left else 0
		new_root.size += self.size
		return new_root

	def findData(self, data = None):
		anySame = -1
		for i,d in enumerate(self.data):
			same = True
			if d == None and data == None:
				anySame = i
				break
			if type(d) != type(data):
				continue
			if (type(d) == dict):
				for j in d:
					if j not in data or data[j] != d[j]:
						same = False
						break
			elif (type(d) == list):
				for j in xrange(len(d)):
					if j > len(data) or data[j] != d[j]:
						same = False
						break
			elif (type(d) == int or type(d) == float or type(d) == str):
				if data != d:
					same = False
			if same:
				anySame = i
				break
		return anySame

	def addData(self, data = None):
		anySame = self.findData(data)
		if anySame < 0:
			self.data.append(data)
			self.duplication.append(1)
		else:
			self.duplication[anySame] += 1

	def removeData(self, data = None):
		anySame = self.findData(data)
		if anySame >= 0:
			self.duplication[anySame] -= 1
			if self.duplication[anySame] == 0:
				self.duplication.pop(anySame)
				self.data.pop(anySame)

	def insert(self, key, data = None):
		"""
		Insert the key and data
		"""
		comp = keyComp(key, self.key)
		# insert
		self.size += 1
		if comp == 0:
			self.addData(data)
		elif comp < 0:
			if self.left:
				self.left = self.left.insert(key, data)
			else:
				self.left = treenode(key, data)
		else:
			if self.right:
				self.right = self.right.insert(key, data)
			else:
				self.right = treenode(key, data)
		# balancing
		leftSize = 0 if not self.left else self.left.size
		rightSize = 0 if not self.right else self.right.size
		if leftSize - rightSize > 1:
			return self.rightTurn()
		if rightSize - leftSize > 1:
			return self.leftTurn()
		return self
	def delete(self, key, data):
		"""
		Delete the key and data
		"""
		comp = keyComp(key, self.key)
		# delete
		if comp == 0:
			leftSize = 0 if not self.left else self.left.size
			rightSize = 0 if not self.right else self.right.size
			self.removeData(data)
			if sum(self.duplication) == 0:
				self.size = leftSize + rightSize
				if self.size == 0:
					return None
				else:
					if leftSize >= rightSize:
						ret = self.rightTurn()
						ret.right = self.delete(key, data)
						ret.size = sum(ret.duplication) + (0 if not ret.left else ret.left.size) + (0 if not ret.right else ret.right.size)
						return ret
					else:
						ret = self.leftTurn()
						ret.left = self.delete(key, data)
						ret.size = sum(ret.duplication) + (0 if not ret.left else ret.left.size) + (0 if not ret.right else ret.right.size)
						return ret
			else:
				self.size = sum(self.duplication) + leftSize + rightSize
				return self
		elif comp < 0:
			if self.left:
				self.left  = self.left.delete(key, data)
				self.size = sum(self.duplication) + (0 if not self.left else self.left.size) + (0 if not self.right else self.right.size)
			return self
		else:
			if self.right:
				self.right = self.right.delete(key, data)
				self.size = sum(self.duplication) + (0 if not self.left else self.left.size) + (0 if not self.right else self.right.size)
			return self

	def findNode(self, key = None):
		"""
		Find the node with key
		"""
		if not None:
			return None
		comp = keyComp(key, self.key)
		if comp == 0:
			return self
		elif comp < 0 and self.left:
			return self.left.findNode(key)
		elif comp > 0 and self.right:
			return self.right.findNode(key)
		else:
			return None

	def findPath(self, node = None):
		"""
		Find the path to the node
		"""
		if not node:
			return None
		comp = keyComp(node.key, self.key)
		if node == self:
			return [self]
		elif comp < 0 and self.left:
			subpath = self.left.findPath(node)
			return subpath if not subpath else [self] + subpath
		elif comp > 0 and self.right:
			subpath = self.right.findPath(node)
			return subpath if not subpath else [self] + subpath
		else:
			return None


	def inorder(self):
		ret = [] if not self.left else self.left.inorder()
		ret += self.data
		ret += [] if not self.right else self.right.inorder()

		return ret

class iterator(object):
	def __init__(self, path, now):
		self.path = path
		if now  ==  self.path[-1]:
			self.path.pop()
		if now.right:
			# there is right subtree
			self.path.append(now)
			self.next = self.now.right
			while self.next.left:
				self.path.append(self.next)
				self.next = self.next.left
		else:
			# there is no right subtree
			self.next = now
			while len(self.path) > 0 and self.next == self.path[-1].right:
				self.next = self.path.pop()
			# now self.next is the left child of its parent or there is no parent anymore
			if len(self.path) == 0:
				self.next = None
			else:
				self.next = self.path[-1].right
				while self.next.left:
					self.path.append(self.next)
					self.next = self.next.left

	def hasNext(self):
		return not not self.next

	def next(self):
		ret = self.next
		if self.next.right:
			self.path.append(self.next)
			self.next = self.next.right
			while self.next.left:
				self.path.append(self.next)
				self.next = self.next.left
		else:
			while len(self.path) > 0 and self.next == self.path[-1].right:
				self.next = self.path.pop()
			if len(self.path) == 0:
				self.next = None
			else:
				self.next = self.path[-1].right
				while self.next.left:
					self.path.append(self.next)
					self.next = self.next.left

class riterator(object):
	def __init__(self, path, now):
		self.path = path
		if now  ==  self.path[-1]:
			self.path.pop()
		if now.left:
			# there is left subtree
			self.path.append(now)
			self.prev = self.now.left
			while self.prev.right:
				self.path.append(self.prev)
				self.prev = self.prev.right
		else:
			# there is no left subtree
			self.prev = now
			while len(self.path) > 0 and self.prev == self.path[-1].left:
				self.prev = self.path.pop()
			# now self.prev is the left child of its parent or there is no parent anymore
			if len(self.path) == 0:
				self.prev = None
			else:
				self.prev = self.path[-1].left
				while self.prev.right:
					self.path.append(self.prev)
					self.prev = self.prev.right

	def hasPrev(self):
		return not not self.prev

	def prev(self):
		ret = self.prev
		if self.prev.left:
			self.path.append(self.prev)
			self.prev = self.prev.left
			while self.prev.right:
				self.path.append(self.prev)
				self.prev = self.prev.right
		else:
			while len(self.path) > 0 and self.prev == self.path[-1].left:
				self.prev = self.path.pop()
			if len(self.path) == 0:
				self.prev = None
			else:
				self.prev = self.path[-1].left
				while self.prev.right:
					self.path.append(self.prev)
					self.prev = self.prev.right

class bTree(object):
	"""
	The class offers an balanced tree by its left and right subtree size roughly equal
	"""
	def __init__(self):
		self.root = None
	def insert(self, key, data = None):
		if not self.root:
			self.root = treenode(key, data)
		else:
			self.root = self.root.insert(key, data)
	def delete(self, key, data = None):
		if self.root:
			self.root = self.root.delete(key, data)
	def printlevel(self):
		q = [self.root]
		while len(q) > 0:
			c = len(q)
			for i in xrange(c):
				crt = q.pop(0)
				if not crt:
					print None,
				else:
					print crt.key,
					q += [crt.left, crt.right]
			print
	def inorder(self):
		if not self.root:
			return []
		else:
			return self.root.inorder()
	def findNode(self, key = None):
		if not key or not self.root:
			return None
		else:
			return self.root.findNode(key)
	def findPath(self, node = None):
		if not node or not self.root:
			return None
		else:
			return self.root.findPath(node)