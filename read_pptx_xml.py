import zipfile
from xml.etree import ElementTree as ET
import sys

def get_text_from_xml(xml_content):
    tree = ET.fromstring(xml_content)
    namespaces = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
    texts = []
    for node in tree.findall('.//a:t', namespaces):
        if node.text:
            texts.append(node.text)
    return texts

pptx_path = r"c:\Users\Hariom\Downloads\Nexora2026_IDEA_Presentation_Format.pptx"

with zipfile.ZipFile(pptx_path, 'r') as slide_zip:
    for name in slide_zip.namelist():
        if name.startswith('ppt/slides/slide'):
            print(f"--- {name} ---")
            xml_content = slide_zip.read(name)
            texts = get_text_from_xml(xml_content)
            print(" ".join(texts)[:500])
