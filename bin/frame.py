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
    diffThreshold = 85

    # check if it is too dark
    if np.max(img) < darkThreshold:
        return [False, "nothing light"]

    # check if the difference in image is too small
    if np.max(img) - np.min(img) < diffThreshold:
        return [False, "difference is too small"]

    return [True, "all pass"]


def clip(args):
    """ clip an image for (x,y) to (x+width, y+height) """
    # args = [img, x, y, height, width]
    # # # # # # # # # # 
    # o ------------------------------- x
    # |     ________________________
    # |    |(x,y)                   |
    # |    |                        |
    # |    |                        |
    # |    |________________________|     
    # |                              (x+width, y+height)
    # |
    # y
    #
    
    # parse data
    img, x, y, width, height = args


    # check if the (x+width, y+height) is out of range
    ly, lx, dim = img.shape
    if x+width > lx or y+height > ly:
        return [False, np.array([], dtype='int32'), x, y]

    p = img[y:y+height, x:x+width, :3]

    flag, message = checkContent([p])

    if flag:
        return [True, p, x, y]
    else:
        print "At "+str(x)+","+str(y)+" "+message

        return [False, p, x, y]

def uploadPatch(args):
    """ upload the images to parse,
        build the corresponding patches object,
        and delete the file"""
    ## parse arguments
    clipImg, fileName, positionXAtFrame, positionYAtFrame, sizeWidth, sizeHeight, frameObjectId = args

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
    connection.request('POST', '/1/classes/Patch', json.dumps({
        "presentTime": 0,
        "noLabelTime": 0,
        "positionXAtFrame": positionXAtFrame,
        "positionYAtFrame": positionYAtFrame,
        "sizeWidth": sizeWidth,
        "sizeHeight": sizeHeight,
        "image": {
            "name": parseFile,
            "__type": "File"
        },
        "frame": {
            "__type": "Pointer",
            "className": "Frame",
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
    filePath, seriesID, order, sizeWidth, sizeHeight = args

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
    connection.request('POST', '/1/classes/Frame', json.dumps({
        # "seriesID": seriesID,
        "order": order,
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
    iy, ix, dim = img.shape

    ## set up multiprocessing
    pool = Pool(processes = 4)
    args = []
    for positionXAtFrame in range(0, ix, sizeWidth/2):
        for positionYAtFrame in range(0, iy, sizeHeight/2):
            args_unit = [img, positionXAtFrame, positionYAtFrame, sizeWidth, sizeHeight, frameObjectId]
            args.append(args_unit)

    pool.map(multiProcessAssis, args)

    return [img, frameObjectId]

def multiProcessAssis(args):
    """ assistant function to process the frame in multi processes"""
    ## parse data
    img, positionXAtFrame, positionYAtFrame, sizeWidth, sizeHeight, frameObjectId = args
    ## clip the image
    flag, clipImg, positionXAtFrame, positionYAtFrame = clip([img, positionXAtFrame, positionYAtFrame, sizeWidth, sizeHeight])
    ## uploads
    if flag:
        fileName = str(positionXAtFrame)+'_'+str(positionYAtFrame)+'.png'
        uploadPatch([clipImg, fileName, positionXAtFrame, positionYAtFrame, sizeWidth, sizeHeight, frameObjectId])


if __name__ == "__main__":
    

    ## set up settings
    seriesID = 1 
    order = 1
    sizeWidth = 100
    sizeHeight = 100

    ## process frame
    filePath = "frame"+str(order)+".bmp"
    processFrame([filePath, seriesID, order, sizeWidth, sizeHeight])

