#!/usr/bin/python
#-*- coding: UTF-8 -*-

import webkit
import sys
import os
import gobject
import pygtk
import gtk
from sugar.activity import activity
from sugar.graphics import style

class SketchometryActivity(activity.Activity):
    def __init__(self,handle):
        activity.Activity.__init__(self,handle)

        # Standard-Toolbar
        toolbox = activity.ActivityToolbox(self)
        activity_toolbar = toolbox.get_activity_toolbar()
        activity_toolbar.keep.props.visible = False
        activity_toolbar.share.props.visible = False
        self.set_toolbox(toolbox)
        toolbox.show()

         #Assign self._top_canvas_box to be the top level widget on the canvas
        self._top_canvas_box = gtk.VBox()


        self.startv = Sketchometry()
        self.startv.hauptbox.show()
        
        #Zuweisen der Hauptbox auf der Canvas (vergleichbar mit toplevel-Window
        self._top_canvas_box = self.startv.hauptbox

        #Setzen der Canvas (Hauptbildschirm der Activity)
        self.set_canvas(self._top_canvas_box)

    def refreshmain(box):
        self._top_canvas_box = box
        #Setzen der Canvas (Hauptbildschirm der Activity)
        self.set_canvas(self._top_canvas_box)
 
class Sketchometry(object):
    hauptbox = gtk.VBox(True, 1)
    def __init__(self):
        web = webkit.WebView()
        pfad = os.path.join(os.getcwd(), "index.html")
        web.open(pfad)
        self.hauptbox.pack_start(web)
        self.hauptbox.show()
        web.show()
        
 
    def event_delete(self, widget, event, data=None):
        return False
 
    def destroy(self, data=None):
        gtk.main_quit()
 
    def main(self):
        gtk.main()
 
 
if __name__ == "__main__":
    start = Sketchometry()
    start.main()

