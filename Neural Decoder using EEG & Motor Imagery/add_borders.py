"""Add a page border to every page of one or more .docx files, in place.

    py add_borders.py file1.docx [file2.docx ...]

A thin navy double line, 24 pt in from the page edge. A page border is drawn in the margin and
never moves text, so the layout of an existing document stays exactly as it was.
Running it twice is harmless: an existing border is replaced.
"""
import re
import sys
import zipfile
from pathlib import Path

LINE = '<w:{0} w:val="double" w:sz="6" w:space="24" w:color="1F3864"/>'
BORDER = '<w:pgBorders w:offsetFrom="page">' + "".join(LINE.format(s) for s in ("top", "left", "bottom", "right")) + "</w:pgBorders>"


def add(xml):
    xml = re.sub(r"<w:pgBorders\b.*?</w:pgBorders>", "", xml, flags=re.S)
    # pgBorders follows pgMar (and paperSrc, if any) inside every sectPr
    out, n = re.subn(r"(<w:pgMar\b[^>]*/>(?:<w:paperSrc\b[^>]*/>)?)", r"\1" + BORDER, xml)
    if n == 0:
        raise SystemExit("no page margins found: is this a Word document?")
    return out, n


def main(paths):
    for path in map(Path, paths):
        tmp = path.with_suffix(".tmp")
        with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "word/document.xml":
                    xml, n = add(data.decode("utf-8"))
                    data = xml.encode("utf-8")
                zout.writestr(item, data)
        tmp.replace(path)
        print(f"{path.name}: border on {n} section(s)")


if __name__ == "__main__":
    assert add('<w:sectPr><w:pgMar w:top="1"/></w:sectPr>')[0].count("pgBorders") == 2  # self-check
    main(sys.argv[1:])
