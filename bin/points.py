from scipy import misc
import numpy as np
import json, httplib, urllib
import os, random
import csv
from multiprocessing import Pool

def downloadSuperPoint():
    """ The function to download the list of super point """
    ## set up connection configuration
    appID = "7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf"
    RESTID = "fgj81WHdh1pAIAoyEXg8HyElsT0nmmxgAg9vhykD"

    ## set up connection
    connection = httplib.HTTPSConnection('api.parse.com', 443)
    connection.connect()
    params = urllib.urlencode({'limit':1000})

    # parse the instances
    connection.request('GET', '/1/classes/SuperPoint?%s' % params, '', {
        "X-Parse-Application-Id": appID,
        "X-Parse-REST-API-Key": RESTID
    })
    result = json.loads(connection.getresponse().read())

    # save to file
    with open('superPoint.csv','wb') as csvfile:
        wrt = csv.writer(csvfile)
        for ins in result['results']:
            wrt.writerow([int(round(ins['meanPositionXAtFrame'])), int(round(ins['meanPositionYAtFrame']))])

def markInFrame():
    ## read the frame image
    img = misc.imread("frame1.bmp")
    iy, ix, dim = img.shape

    ## load the x and y position
    pos = []
    with open('superPoint.csv', 'rb') as csvfile:
        rdr = csv.reader(csvfile)
        for row in rdr:
            pos.append((int(row[0]), int(row[1])))

    ## add a red marker in the frame image
    for point in pos:
        x = point[0]
        y = point[1]
        # add a cross at this position
        for i in xrange(7):
            if x-i >= 0 and y-i >= 0:
                img[y-i, x-i] = np.array([255, 0, 0])
            if x-i >= 0 and y+i < iy:
                img[y+i, x-i] = np.array([255, 0, 0])
            if x+i < ix and y-i >= 0:
                img[y-i, x+i] = np.array([255, 0, 0])
            if x+i < ix and y+i < iy:
                img[y+i, x+i] = np.array([255, 0, 0])

    ## write the image to file
    misc.imsave("frame1-mark.bmp", img)

def buildSamplePointInFrame():
    ## read the frame image
    img = misc.imread("frame1.bmp")
    iy, ix, dim = img.shape

    ## set the parameters
    skip = 15
    

    ## load the x and y position
    pos = []
    with open('superPoint.csv', 'rb') as csvfile:
        rdr = csv.reader(csvfile)
        for row in rdr:
            pos.append((int(row[0]), int(row[1])))
    
    ## sample
    samp = []
    for y in xrange(0, iy, skip):
        for x in xrange(0, ix, skip):
            # calculate the closest marker
            cx = pos[0][0]
            cy = pos[0][1]
            for p in pos:
                if (cx - x)*(cx - x) + (cy - y)*(cy - y) > (p[0] - x)*(p[0] - x) + (p[1] - y)*(p[1] - y):
                    cx = p[0]
                    cy = p[1]

            if (cx - x)*(cx - x) + (cy - y)*(cy -y) <= skip*skip:
                samp.append([cx, cy, 1])
            else:
                samp.append([x, y, 0])

    ## add a red marker in the frame image
    for point in samp:
        x = point[0]
        y = point[1]
        # add a cross at this position
        for i in xrange(3):
            if x-i >= 0 and y-i >= 0:
                img[y-i, x-i] = np.array([255, 0, 0])
            if x-i >= 0 and y+i < iy:
                img[y+i, x-i] = np.array([255, 0, 0])
            if x+i < ix and y-i >= 0:
                img[y-i, x+i] = np.array([255, 0, 0])
            if x+i < ix and y+i < iy:
                img[y+i, x+i] = np.array([255, 0, 0])

    ## write the image to file
    misc.imsave("frame1-samp.bmp", img)

    ## write the sample point to csv file
    with open('frameSample.csv','wb') as csvfile:
        wrt = csv.writer(csvfile)
        for point in samp:
            wrt.writerow(point)

def calcCurve():
    ## read the frame image
    img = misc.imread("frame1.bmp")
    iy, ix, dim = img.shape

    ## set the parameters
    skip = 15

    ## load the x and y position
    with open('frameSampleHis.csv', 'wb') as resfile:
        wrt = csv.writer(resfile)
        header = []
        str_rgb = 'rgb'
        for i in xrange(dim):
            for j in xrange(256):
                header.append(str_rgb[i]+str(j))
        # header.append('x')
        # header.append('y')
        header.append('target')
        wrt.writerow(header)
        with open('frameSample.csv', 'rb') as csvfile:
            rdr = csv.reader(csvfile)
            for row in rdr:
                x, y = int(row[0]), int(row[1])
                t = int(row[2])
                left = x - skip - 1
                right = x + skip
                top = y - skip - 1
                bottom = y + skip
                if bottom >= iy:
                    bottom = iy - 1
                if right >= ix:
                    right = ix - 1
                if left < 0:
                    left = 0
                if top < 0:
                    top = 0
                tmp = np.zeros((dim, 256), dtype='uint32')
                for yy in xrange(top, bottom+1):
                    for xx in xrange(left, right+1):
                        r,g,b = img[yy,xx,:3]
                        tmp[0][r] += 1
                        tmp[1][g] += 1
                        tmp[2][b] += 1

                res = []
                for i in xrange(dim):
                    for j in xrange(256):
                        res.append(tmp[i][j])
                # res.append(x)
                # res.append(y)
                res.append(t)

                wrt.writerow(res)


if __name__ == '__main__':
    # downloadSuperPoint()
    # markInFrame()
    # buildSamplePointInFrame()
    calcCurve()
