# http://scipy-lectures.github.io/advanced/image_processing/

from scipy import misc
import numpy as np
from multiprocessing import Pool
import json, httplib
import os

def checkContent(args):
    """ the function to remove some type of patches out of dataset """
    # parse data
    img = args

    # set some metrics
    darkThreshold = 80
    diffThreshold = 50

    # check if it is too dark
    if np.max(img) < darkThreshold:
        return [False, "nothing light"]

    # check if the difference in image is too small
    if np.max(img) - np.min(img) < diffThreshold:
        return [False, "difference is too small"]

    return [True, "all pass"]


def clip(args):
    """ clip an image for (x,y) to (x+height, y+width) """
    # args = [img, x, y, height, width]
    # # # # # # # # # # 
    # o ------------------------------- y
    # |     ________________________
    # |    |(x,y)                   |
    # |    |                        |
    # |    |                        |
    # |    |________________________|     
    # |                              (x+height, y+width)
    # |
    # x
    #
    
    # parse data
    img, x, y, height, width = args


    # check if the (x+height, y+width) is out of range
    lx, ly, dim = img.shape
    if x+height > lx or y+width > ly:
        return [False, np.array([], dtype='int32'), x, y]

    p = img[x:x+height, y:y+width, :3]

    flag, message = checkContent([p])

    if flag:
        return [True, p, x, y]
    else:
        if message == "difference is too small":
            print "Too small at:" + str(x) + "," + str(y)

        return [False, p, x, y]

def uploadPatch(args):
    """ upload the images to parse,
        build the corresponding patches object,
        and delete the file"""
    ## parse arguments
    clipImg, fileName, seriesID, frameID, x, y, height, width, frameObjectId = args

    ## save the data as file
    misc.imsave(fileName, clipImg)

    ## set up connection configuration
    appID = "7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf"
    RESTID = "fgj81WHdh1pAIAoyEXg8HyElsT0nmmxgAg9vhykD"

    ## set up connection
    connection = httplib.HTTPSConnection('api.parse.com', 443)
    connection.connect()

    # send the file
    connection.request('POST', '/1/files/patch.png', open(fileName, 'rb').read(), {
        "X-Parse-Application-Id": appID,
        "X-Parse-REST-API-Key": RESTID,
        "Content-Type": "image/png"
    })
    result = json.loads(connection.getresponse().read())

    # parse the unique file name in parse
    parseFile = result[unicode('name')]

    # build the corresponding patch object
    connection.request('POST', '/1/classes/Patches', json.dumps({
        "seriesID": seriesID,
        "frameID": frameID,
        "x": x,
        "y": y,
        "height": height,
        "width": width,
        "image": {
            "name": parseFile,
            "__type": "File"
        },
        "frameObject": {
            "__type": "Pointer",
            "className": "Frames",
            "objectId": frameObjectId
        }
    }), {
        "X-Parse-Application-Id": appID,
        "X-Parse-REST-API-Key": RESTID,
        "Content-Type": "application/json"
    })
    result = json.loads(connection.getresponse().read())

    # delete the file
    os.remove(fileName)

def processFrame(args):
    """ upload the images to parse,
        build the corresponding frames object"""
    ## parse arguments
    filePath, seriesID, frameID, height, width = args

    ## parse the image from file
    img = misc.imread(filePath)

    ## set up connection configuration
    appID = "7JSMjdDlgmtsWgGY5LOPMm3tCluhAo7Wmuu9MLpf"
    RESTID = "fgj81WHdh1pAIAoyEXg8HyElsT0nmmxgAg9vhykD"

    ## set up connection
    connection = httplib.HTTPSConnection('api.parse.com', 443)
    connection.connect()

    # send the file
    connection.request('POST', '/1/files/frame.png', open(filePath, 'rb').read(), {
        "X-Parse-Application-Id": appID,
        "X-Parse-REST-API-Key": RESTID,
        "Content-Type": "image/png"
    })
    result = json.loads(connection.getresponse().read())

    # parse the unique file name in parse
    parseFile = result[unicode('name')]

    # build the corresponding frame object
    connection.request('POST', '/1/classes/Frames', json.dumps({
        "seriesID": seriesID,
        "frameID": frameID,
        "image": {
            "name": parseFile,
            "__type": "File"
        }
    }), {
        "X-Parse-Application-Id": appID,
        "X-Parse-REST-API-Key": RESTID,
        "Content-Type": "application/json"
    })
    result = json.loads(connection.getresponse().read())

    # parse the objectId of the frame object
    frameObjectId = result[unicode("objectId")]

    ## get the shape
    ix, iy, dim = img.shape

    ## set up multiprocessing
    pool = Pool(processes = 4)
    args = []
    for i in range(0, ix, height/2):
        for j in range(0, iy, width/2):
            args_unit = [img, seriesID, frameID, i, j, height, width, frameObjectId]
            args.append(args_unit)

    pool.map(multiProcessAssis, args)

    return [img, frameObjectId]

def multiProcessAssis(args):
    """ assistant function to process the frame in multi processes"""
    ## parse data
    img, seriesID, frameID, i, j, height, width, frameObjectId = args
    ## clip the image
    flag, clipImg, x, y = clip([img, i, j, height, width])
    ## uploads
    if flag:
        fileName = str(seriesID)+'_'+str(frameID)+'_'+str(i)+'_'+str(j)+'.png'
        uploadPatch([clipImg, fileName, seriesID, frameID, x, y, height, width, frameObjectId])


if __name__ == "__main__":
    

    ## set up settings
    seriesID = 1 
    frameID = 1
    height = 100
    width = 100

    ## process frame
    filePath = "frame"+str(frameID)+".bmp"
    processFrame([filePath, seriesID, frameID, height, width])

