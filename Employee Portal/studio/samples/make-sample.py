"""Builds samples/shaft-support.step, the sample assembly Model Studio opens from
its start screen and the tests load.

Needs the OpenCascade Python bindings:  pip install cadquery-ocp-novtk
Run:  python3 make-sample.py
"""
import math
import os
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox, BRepPrimAPI_MakeCylinder
from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut, BRepAlgoAPI_Fuse
from OCP.gp import gp_Pnt, gp_Ax1, gp_Ax2, gp_Dir, gp_Trsf, gp_Vec
from OCP.TopLoc import TopLoc_Location
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString
from OCP.XCAFDoc import XCAFDoc_DocumentTool, XCAFDoc_ColorSurf
from OCP.TDataStd import TDataStd_Name
from OCP.Quantity import Quantity_Color, Quantity_TOC_RGB
from OCP.STEPCAFControl import STEPCAFControl_Writer
from OCP.STEPControl import STEPControl_AsIs
from OCP.Interface import Interface_Static

Z = gp_Dir(0, 0, 1)
X = gp_Dir(1, 0, 0)


def box(dx, dy, dz, x=0, y=0, z=0):
    return BRepPrimAPI_MakeBox(gp_Pnt(x, y, z), dx, dy, dz).Shape()


def cyl(r, h, p=(0, 0, 0), d=Z):
    return BRepPrimAPI_MakeCylinder(gp_Ax2(gp_Pnt(*p), d), r, h).Shape()


def cut(a, b):
    return BRepAlgoAPI_Cut(a, b).Shape()


def fuse(a, b):
    return BRepAlgoAPI_Fuse(a, b).Shape()


def moved(x, y, z, upright=False):
    t = gp_Trsf()
    t.SetTranslation(gp_Vec(x, y, z))
    if upright:
        # The parts are modelled Z-up; the assembly is stood Y-up, the way
        # SolidWorks and Model Studio expect it.
        r = gp_Trsf()
        r.SetRotation(gp_Ax1(gp_Pnt(0, 0, 0), X), -math.pi / 2)
        t = r.Multiplied(t)
    return TopLoc_Location(t)


# Parts (millimetres). The shaft runs along X at height 60.
base = box(220, 80, 12, -110, -40, 0)
for hx in (-90, 90):
    for hy in (-25, 25):
        base = cut(base, cyl(4.5, 20, (hx, hy, -4)))

bracket = fuse(box(24, 60, 48, -12, -30, 0), cyl(22, 24, (-12, 0, 60), X))
bracket = cut(bracket, cyl(14, 30, (-15, 0, 60), X))

bearing = cut(cyl(14, 16, (-8, 0, 0), X), cyl(8, 20, (-10, 0, 0), X))
shaft = cyl(8, 240, (-120, 0, 60), X)
wheel = cut(fuse(cyl(40, 14, (-7, 0, 0), X), cyl(14, 26, (-13, 0, 0), X)), cyl(8, 30, (-15, 0, 0), X))
for i in range(6):
    a = i * math.pi / 3
    wheel = cut(wheel, cyl(7, 30, (-15, 26 * math.cos(a), 26 * math.sin(a)), X))
bolt = fuse(cyl(4, 22, (0, 0, -6)), cyl(7, 5, (0, 0, 16)))
key = box(30, 5, 5, -15, -2.5, 6)

doc = TDocStd_Document(TCollection_ExtendedString("XmlOcaf"))
shapes = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
colors = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())


def name(label, text):
    TDataStd_Name.Set_s(label, TCollection_ExtendedString(text))


def part(shape, text, rgb):
    label = shapes.AddShape(shape, False)
    name(label, text)
    colors.SetColor(label, Quantity_Color(*rgb, Quantity_TOC_RGB), XCAFDoc_ColorSurf)
    return label


steel = (0.62, 0.65, 0.70)
p_base = part(base, "Base plate", (0.20, 0.27, 0.40))
p_bracket = part(bracket, "Bearing bracket", (0.93, 0.47, 0.13))
p_bearing = part(bearing, "Bearing sleeve", (0.80, 0.68, 0.30))
p_shaft = part(shaft, "Drive shaft", steel)
p_wheel = part(wheel, "Hand wheel", (0.16, 0.50, 0.73))
p_bolt = part(bolt, "Bolt M8", (0.30, 0.30, 0.32))
p_key = part(key, "Shaft key", steel)

root = shapes.NewShape()
name(root, "Shaft support assembly")

support = shapes.NewShape()
name(support, "Support sub-assembly")
shapes.AddComponent(support, p_bracket, moved(0, 0, 12))
shapes.AddComponent(support, p_bearing, moved(0, 0, 72))

for sx, label in ((-70, "Left support"), (70, "Right support")):
    c = shapes.AddComponent(root, support, moved(sx, 0, 0, True))
    name(c, label)
shapes.AddComponent(root, p_base, moved(0, 0, 0, True))
shapes.AddComponent(root, p_shaft, moved(0, 0, 12, True))
shapes.AddComponent(root, p_key, moved(130, 0, 71, True))
shapes.AddComponent(root, p_wheel, moved(130, 0, 72, True))
for hx in (-90, 90):
    for hy in (-25, 25):
        shapes.AddComponent(root, p_bolt, moved(hx, hy, 0, True))
shapes.UpdateAssemblies()

Interface_Static.SetCVal_s("write.step.schema", "AP214")
writer = STEPCAFControl_Writer()
writer.SetColorMode(True)
writer.SetNameMode(True)
writer.Transfer(doc, STEPControl_AsIs)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shaft-support.step")
writer.Write(out)
print("wrote", out)
