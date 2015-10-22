# http://scipy-lectures.github.io/advanced/image_processing/

from scipy import misc
import numpy as np
import matplotlib.cm as cm
import matplotlib.pyplot as plt
from copy import deepcopy
from multiprocessing import Pool
from time import time

Vi = 0
Hi = 1
LEFT_TOP = 0
RIGHT_BOTTOM = 0
multiProcessEnable = True

def loadFromHalf(img, limlist, f, c):
    """ Load the partial solve image """
    emptySpot = 0
    for lim in limlist:
        for i in range(lim[0][Vi], lim[1][Vi]):
            for j in range(lim[0][Hi], lim[1][Hi]):
                if np.sum(img[i,j,:3]*img[i,j,:3])==0:
                    if f[i][j] == 1:
                        f[i][j] = 0
                        c[i][j] = float(0)
                        img[i,j] = [0, 0, 0]
                        emptySpot += 1
    return f, c, emptySpot


def rgb2gray(rgb):
    """ image from rgb to greyscale"""
    return np.dot(rgb[...,:3], [0.2989, 0.5870, 0.1440])

def isophote(img, f, theta=0):
    """ compute isophote of image"""
    [Lv, Lh] = np.gradient(img)
    size = img.shape
    sizev = size[Vi]
    sizeh = size[Hi]
    for i in range(sizev):
        for j in range(sizeh):
            if f[i][j] == 0:
                Lv[i,j] = 0
                Lh[i,j] = 0
                if i-1>-1:
                    Lv[i-1,j] = 0
                if i+1<sizev:
                    Lv[i+1,j] = 0
                if j-1>-1:
                    Lh[i,j-1] = 0
                if j+1<sizeh:
                    Lh[i,j+1] = 0
    return Lh, Lv

def argmax(arr):
    """find the index list of max value"""
    size = arr.shape
    arrmax = np.max(arr)
    print "max p:", arrmax,
    li = []
    for i in range(size[0]):
        for j in range(size[1]):
            if arr[i,j] == arrmax:
                li.append((i,j))
    return li

def rectControlPoint(orig, size, radius):
    """compute the patch control point """
    sizev = size[Vi]
    sizeh = size[Hi]
    i = orig[Vi]
    j = orig[Hi]
    left_top = (max([i-radius,0]), max([j-radius,0]))
    right_bottom = (min([i+radius+1, sizev]), min([j+radius+1, sizeh]))
    return left_top, right_bottom

def assignRectCtrlPoint(size, radius):
    """compute the all patches' control point """
    sizev = size[Vi]
    sizeh = size[Hi]
    LEFT_TOP = [[0.0]*sizeh for i in range(sizev)]
    RIGHT_BOTTOM = [[0.0]*sizeh for i in range(sizev)]
    for i in range(sizev):
        for j in range(sizeh):
            left_top, right_bottom = rectControlPoint([i,j], size, radius)
            LEFT_TOP[i][j] = left_top
            RIGHT_BOTTOM[i][j] = right_bottom
    return LEFT_TOP, RIGHT_BOTTOM

def getRectCtrlPoint(i,j):
    """ return the control point of a patch center at (i,j)"""
    left_top = LEFT_TOP[i][j]
    right_bottom = RIGHT_BOTTOM[i][j]
    return left_top, right_bottom

def normalMultiProcessAssis(args):
    """ assis function for multiprocessing in computing normal"""
    f = args[0]
    orig = args[1]
    i = orig[Vi]
    j = orig[Hi]
    left_top, right_bottom = getRectCtrlPoint(i,j)
    tmpv = 0.0
    tmph = 0.0
    center = (float(right_bottom[Vi] - left_top[Vi])/2, float(right_bottom[Hi] - left_top[Hi])/2)
    for m in range(left_top[Vi], right_bottom[Vi]):
        for n in range(left_top[Hi], right_bottom[Hi]):
            if f[m][n] == 0:
                tmpv += m - center[Vi]
                tmph += n - center[Hi]
    tmpD = np.sqrt(tmpv*tmpv + tmph*tmph)
    if tmpD > 0:
        tmpv = tmpv / tmpD
        tmph = tmph / tmpD
    return [i, j, tmpv, tmph]

def normal(f, size, radius, pool):
    """ compute normal"""
    sizev = size[Vi]
    sizeh = size[Hi]
    Nv = np.array([[0.0]*sizeh for i in range(sizev)], dtype="float64")
    Nh = np.array([[0.0]*sizeh for i in range(sizev)], dtype="float64")
    if multiProcessEnable:
        args = []
        for i in range(sizev):
            for j in range(sizeh):
                arg_unit = [f, (i,j)]
                args.append(arg_unit)
        resultList = pool.map(normalMultiProcessAssis, args)
        for result in resultList:
            i = result[0]
            j = result[1]
            Nv[i,j] = result[2]
            Nh[i,j] = result[3]
    else:
        for i in range(sizev):
            for j in range(sizeh):
                left_top, right_bottom = getRectCtrlPoint(i,j)
                tmpv = 0.0
                tmph = 0.0
                center = (float(right_bottom[Vi] - left_top[Vi])/2, float(right_bottom[Hi] - left_top[Hi])/2)
                for m in range(left_top[Vi], right_bottom[Vi]):
                    for n in range(left_top[Hi], right_bottom[Hi]):
                        if f[m][n] == 0:
                            tmpv += m - center[Vi]
                            tmph += n - center[Hi]
                tmpD = np.sqrt(tmpv*tmpv + tmph*tmph)
                if tmpD > 0:
                    tmpv = tmpv / tmpD
                    tmph = tmph / tmpD
                Nv[i,j] = tmpv
                Nh[i,j] = tmph

    return Nv, Nh

def getPatch(img, orig, radius):
    """ get the patch"""
    i = orig[Vi]
    j = orig[Hi]
    p = np.zeros((radius*2+1, radius*2+1, 3))
    left_top, right_bottom = getRectCtrlPoint(i,j)
    for m in range(left_top[Vi], right_bottom[Vi]):
        for n in range(left_top[Hi], right_bottom[Hi]):
            p[m - i + radius, n - j + radius,:3] = img[m,n,:3]

    return p

def getFilledMark(f, orig, radius):
    """ get the filled region of a patch """
    i = orig[Vi]
    j = orig[Hi]
    mark = np.zeros((radius*2+1, radius*2+1))
    left_top, right_bottom = getRectCtrlPoint(i,j)
    for m in range(left_top[Vi], right_bottom[Vi]):
        for n in range(left_top[Hi], right_bottom[Hi]):
            mark[m - i + radius, n - j + radius] = f[m][n]

    return mark

def checkFilled(f, orig, radius):
    """ check is a patch is fully filled """
    i = orig[Vi]
    j = orig[Hi]
    left_top, right_bottom = getRectCtrlPoint(i,j)
    if right_bottom[Vi] - left_top[Vi] < radius*2+1:
        return False
    if right_bottom[Hi] - left_top[Hi] < radius*2+1:
        return False
    for m in range(left_top[Vi], right_bottom[Vi]):
        for n in range(left_top[Hi], right_bottom[Hi]):
            if f[m][n] == 0:
                return False
    return True

def getDifferent(old_patch, new_patch, mark, radius):
    """ compute the different between patches in rgb space"""
    d = 0
    for i in range(radius*2+1):
        for j in range(radius*2+1):
            if mark[i,j] == 0:
                continue
            tmpd = old_patch[i,j,:3] - new_patch[i,j,:3]
            d = d+float(np.sum(tmpd*tmpd))
    return np.sqrt(d)

def getDifferent_gray(old_patch, new_patch, mark, radius):
    """ compute the different between patches in grayscale space"""
    d = 0
    old_patch = rgb2gray(old_patch)
    new_patch = rgb2gray(new_patch)
    for i in range(radius*2+1):
        for j in range(radius*2+1):
            if mark[i,j] == 0:
                continue
            tmpd = old_patch[i,j] - new_patch[i,j]
            d = d+float(np.sum(tmpd*tmpd))
    return np.sqrt(d)

def findMatchMultiProcessAssis(args):
    """ assistance function for find best match by using multiprocessing"""
    old_patch = args[0]
    mark = args[1]
    img = args[2]
    f = args[3]
    orig = args[4]
    radius = args[5]
    if checkFilled(f, orig, radius):
        new_patch = getPatch(img, orig, radius)
        delta = getDifferent(old_patch, new_patch, mark, radius)
    else:
        new_patch = []
        delta = float("Inf")
    return [delta, new_patch, orig]

def findMatch(img, orig, f, size, radius, pool):
    """ find the best match patch"""
    sizev = size[Vi]
    sizeh = size[Hi]
    origv = orig[Vi]
    origh = orig[Hi]
    old_patch = getPatch(img, orig, radius)
    mark = getFilledMark(f, orig, radius)
    minDelta = float("Inf")
    sv = 40
    sh = 40
    vrange = range(max([0, origv-sv]), min([origv+sv+1, sizev]))
    hrange = range(max([0, origh-sh]), min([origh+sh+1, sizeh]))
    if multiProcessEnable:
        args = []
        for i in vrange:
            for j in hrange:
                arg_unit = [old_patch, mark, img, f, (i,j), radius]
                args.append(arg_unit)
        resultList = pool.map(findMatchMultiProcessAssis, args)
        for result in resultList:
            delta = result[0]
            if delta < minDelta:
                match_patch = result[1]
                minDelta = delta
                match_center = result[2]
        # args = [[userName, chartList[i]] for i in range(listLength)]
        # listenObjList = pool.map(getWeeklyArtistChart, args)
    else:
        for i in vrange:
            for j in hrange:
                if checkFilled(f, (i,j), radius):
                    new_patch = getPatch(img, (i,j), radius)
                    delta = getDifferent(old_patch, new_patch, mark, radius)
                    if delta < minDelta:
                        match_patch = new_patch
                        minDelta = delta
                        match_center = (i,j)
                else:
                    continue

    return match_patch, match_center

def renewC(c, f, size, radius):
    """Update confidence values"""
    sizev = size[Vi]
    sizeh = size[Hi]
    stable = False
    times = 0
    while not stable:
        c_new = [[0.0]*sizeh for i in range(sizev)]
        stable = True
        for i in range(sizev):
            for j in range(sizeh):
                if f[i][j] == 1:
                    c_new[i][j] = c[i][j]
                    continue
                left_top, right_bottom = getRectCtrlPoint(i,j)
                num = (right_bottom[Vi] - left_top[Vi]) * (right_bottom[Hi] - left_top[Hi])
                for m in range(left_top[Vi], right_bottom[Vi]):
                    for n in range(left_top[Hi], right_bottom[Hi]):
                        if f[m][n] == 1:
                            c_new[i][j] += c[m][n]
                c_new[i][j] = c_new[i][j] / num
                # if c_new[i][j] != c[i][j]:
                #     stable = False
        if times % 10 == 0:
            print times,
        times += 1
        c = c_new

    return c_new

def replacePatch(img, orig, fill_patch, patch_center, f, c, size, radius):
    """ fill a target patch"""
    i = orig[Vi]
    j = orig[Hi]
    p_i = patch_center[Vi]
    p_j = patch_center[Hi]
    left_top, right_bottom = getRectCtrlPoint(i,j)
    num = 0
    for m in range(left_top[Vi], right_bottom[Vi]):
        for n in range(left_top[Hi], right_bottom[Hi]):
            if f[m][n] == 0:
                img[m,n,:3] = fill_patch[m - i + radius, n - j + radius,:3]
                # c[m][n] = c[i][j]
                f[m][n] = 1
                num += 1
            # c[m][n] = 1.0

    c = renewC(c, f, size, radius)
    return img, f, c, num



# load image
# img = misc.imread('IMG_0588.JPG')
# img = misc.imread('IMG_0588_small.jpg')
# img = misc.imread('img-001.jpg')
# img = misc.imread('simple.jpg')
# img = misc.imread('IMG_1009_small.jpg')
img = misc.imread('now-980.png')
loadOFInitial = False
img_original = deepcopy(img)
img_gray = rgb2gray(img_original)
figi = 1
plt.figure(figi)
figi += 1
plt.imshow(img_gray, cmap = cm.Greys_r)

plt.figure(figi)
figi += 1
plt.imshow(img_original)

# set the area need to remove
# 255 255
# limlist = [[(335, 170), (720, 440)]]
# limlist = [[(66,34), (144,87)]]
# limlist = [[(276,102),(306,128)], [(125,110),(157,166)], [(133,110),(280,129)], [(305,107),(320,125)]]
# limlist = [[(36,36), (91, 91)]]
limlist = [[(183,22), (290, 117)]]
# limlist = [[(180, 155), (268, 192)]]
# set the radius of a patch
radius = 6
# get the image size
size = img.shape
sizev = size[Vi]
sizeh = size[Hi]
print size
# assign the rectangle control point
[LEFT_TOP, RIGHT_BOTTOM] = assignRectCtrlPoint(size, radius)
# set the confidence
c = [[1.0]*sizeh for i in range(sizev)]
# set the mask to know if the pixel is filled
f = [[1]*sizeh for i in range(sizev)]
if not loadOFInitial:
    [f,c,emptySpot] = loadFromHalf(img, limlist, f, c)
else:
    emptySpot = 0
    for lim in limlist:
        for i in range(lim[0][Vi], lim[1][Vi]):
            for j in range(lim[0][Hi], lim[1][Hi]):
                if f[i][j] != 0:
                    c[i][j] = float(0)
                    f[i][j] = 0
                    img[i,j] = [0, 0, 0]
                    emptySpot += 1

if __name__ == "__main__":
    times = 980
    pool = Pool(processes = 4)
    startTime = time()
    filledSpot = 0
    misc.imsave('inital-'+str(times)+'.png', img)
    while True:
        # c = renewC(c, f, size, radius)
        C = np.array(c, dtype="float64")
        [Iv, Ih] = isophote(np.float64(rgb2gray(img)), f)
        [Nv, Nh] = normal(f, size, radius, pool)
        Dv = Iv*Nv
        Dh = Ih*Nh
        D = np.sqrt(Dv*Dv+Dh*Dh)/255
        print "max in C:", np.max(C), "min in C:", np.min(C), "max in D:", np.max(D), "min in D:", np.min(D), 
        P = C*D
        P = P/np.max(P)
        p = P.tolist()
        fillList = argmax(P)
        print fillList,
        for orig in fillList:
            origv = orig[Vi]
            origh = orig[Hi]
            fill_patch, patch_center = findMatch(img, orig, f, size, radius, pool)
            [img, f, c, num] = replacePatch(img, orig, fill_patch, patch_center, f, c, size, radius)
            emptySpot -= num
            filledSpot += num

        if emptySpot == 0:
            break

        nowTime = time()
        print "Estimate Time:", (nowTime - startTime) / filledSpot * emptySpot, "\r",


        if times % 20 == 0:
            misc.imsave('now-'+str(times)+'.png', img)

        times += 1



    plt.figure(figi)
    figi += 1
    plt.imshow(img)
    misc.imsave('now-'+str(times)+'.png', img)


    plt.show()