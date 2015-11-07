# http://scipy-lectures.github.io/advanced/image_processing/

from scipy import misc
import numpy as np
from multiprocessing import Pool
import json, httplib
import os

## parse the image from file
img = misc.imread("tfss-e9292845-414d-4d86-9058-64063ea5c502-patch.png")

print np.max(img)
print np.min(img)
print np.max(img) - np.min(img)


## parse the image from file
img = misc.imread("tfss-6d9d8987-5783-4ee5-a97a-3a4246c71811-patch.png")

print np.max(img)
print np.min(img)
print np.max(img) - np.min(img)

## parse the image from file
img = misc.imread("tfss-c598e113-25f3-4aff-a419-520727365399-patch.png")

print np.max(img)
print np.min(img)
print np.max(img) - np.min(img)

## parse the image from file
img = misc.imread("tfss-c6ec8949-bbc7-433a-ab08-b838f583a1a4-patch.png")

print np.max(img)
print np.min(img)
print np.max(img) - np.min(img)