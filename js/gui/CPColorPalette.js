/*
    ChibiPaint
    Copyright (c) 2006-2008 Marc Schefer

    This file is part of ChibiPaint.

    ChibiPaint is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    ChibiPaint is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with ChibiPaint. If not, see <http://www.gnu.org/licenses/>.

 */

function CPColorPalette(cpController) {
    "use strict";
    
    CPPalette.call(this, cpController, "color", "Color");
    
    var 
        curColor = new CPColor(),
        colorSelect = new CPColorSelect(cpController)/*,
        colorSlider  new CPColorSlider(colorSelect),
        colorShow = new CPColorShow(cpController)*/;
        
    cpController.on("colorChange", function(color) {
        curColor.copyFrom(color);
        
        //colorSlider.setHue(curColor.getHue());
    });
    
    var
        body = this.getBodyElement();
    
    body.appendChild(colorSelect.getElement());
    //body.appendChild(colorSlider.getElement());
    //body.appendChild(colorShow.getElement());
}

function CPColorSelect(cpController) {
    "use strict";

    var 
        w = 128, h = 128,
        
        canvas = document.createElement("canvas"),
        canvasContext = canvas.getContext("2d"),
        
        imageData = new ImageData(w, h),
        data = imageData.data,
        color = new CPColor(),
        
        needRefresh = true,
        
        capturedMouse = false;
    
    function makeBitmap() {
        var
            col = color.clone(),
            pixIndex = 0;
        
        for (var y = 0; y < h; y++) {
            col.setValue(255 - (y * 255) / h);
            
            for (var x = 0; x < w; x++) {
                col.setSaturation((x * 255) / w);
                
                data[pixIndex + CPColorBmp.RED_BYTE_OFFSET] = (col.rgb >> 16) & 0xFF; 
                data[pixIndex + CPColorBmp.GREEN_BYTE_OFFSET] = (col.rgb >> 8) & 0xFF
                data[pixIndex + CPColorBmp.BLUE_BYTE_OFFSET] = col.rgb & 0xFF
                data[pixIndex + CPColorBmp.ALPHA_BYTE_OFFSET] = 0xFF;
                
                pixIndex += CPColorBmp.BYTES_PER_PIXEL;
            }
        }
        
        needRefresh = false;
    }

    function paint() {
        if (needRefresh) {
            makeBitmap();
        }
        
        canvasContext.putImageData(imageData, 0, 0, 0, 0, w, h);
        
        var 
            x = color.getSaturation() * w / 255,
            y = (255 - color.getValue()) * h / 255;

        canvasContext.globalCompositeOperation = 'exclusion';
        canvasContext.strokeStyle = 'white';
        canvasContext.lineWidth = 1.5;
        
        canvasContext.beginPath();
        canvasContext.arc(x, y, 5, 0, Math.PI * 2);
        canvasContext.stroke();
        
        canvasContext.globalCompositeOperation = 'source-over';
    }
    
    function mousePickColor(e) {
        var
            x = e.pageX - $(canvas).offset().left,
            y = e.pageY - $(canvas).offset().top,
            
            sat = x * 255 / w,
            value = 255 - y * 255 / h;

        color.setSaturation(Math.max(0, Math.min(255, sat)));
        color.setValue(Math.max(0, Math.min(255, value)));

        paint();
        cpController.setCurColor(color);
    }
        
    function continueDrag(e) {
        mousePickColor(e);
    }
    
    function endDrag(e) {
        capturedMouse = false;
        document.body.removeEventListener("mouseup", endDrag);
        document.body.removeEventListener("mousemove", continueDrag);
    }
    
    function startDrag(e) {
        if (!capturedMouse) {
            capturedMouse = true;
            document.body.addEventListener("mouseup", endDrag);
            document.body.addEventListener("mousemove", continueDrag);
        }
        
        mousePickColor(e);
    }
    
    this.setHue = function(hue) {
        if (color.getHue() != hue) {
            color.setHue(hue);
            cpController.setCurColor(color);
        }
    };
    
    this.getElement = function() {
        return canvas;
    };
    
    cpController.on("colorChange", function(c) {
        color.copyFrom(c);

        needRefresh = true;
        paint();
    });

    canvas.width = w;
    canvas.height = h;

    canvas.addEventListener("mousedown", startDrag);
    
    paint();
}

/*function CPColorSlider(selecter) {
    "use strict";

    var 
        w = 24, h = 128,
        
        canvas = document.createElement("canvas"),
        canvasContext = canvas.getContext("2d");
        
        imageData = new ImageData(w, h),
        data = imageData.data,
        
        hue = 0;
    
    makeBitmap();

    addMouseListener(this);
    addMouseMotionListener(this);

    function makeBitmap() {
        var
            color = new CPColor(),
            pixIndex = 0;
        
        color.setRgbComponents(0, 255, 255);
        
        for (var y = 0; y < h; y++) {
            color.setHue((y * 359) / h);
            
            for (var x = 0; x < w; x++) {
                data[pixIndex + CPColorBmp.RED_BYTE_OFFSET] = (color.rgb >> 16) & 0xFF; 
                data[pixIndex + CPColorBmp.GREEN_BYTE_OFFSET] = (color.rgb >> 8) & 0xFF
                data[pixIndex + CPColorBmp.BLUE_BYTE_OFFSET] = color.rgb & 0xFF
                data[pixIndex + CPColorBmp.ALPHA_BYTE_OFFSET] = 0xFF;
                
                pixIndex += CPColorBmp.BYTES_PER_PIXEL;
            }
        }
    }

    function paint() {
        canvasContext.putImageData(imageData, 0, 0, 0, 0, w, h);
        
        var 
            y = (hue * h) / 360;
        
        canvasContext.globalCompositeOperation = 'xor';
        canvasContext.strokeStyle.color = 'rgba(255, 255, 255, 0)';
        
        canvasContext.beginPath();
        canvasContext.moveTo(0, y);
        canvasContext.lineTo(w, y);
        canvasContext.stroke();
        
        canvasContext.globalCompositeOperation = 'source-over';
    }

    public void mousePressed(MouseEvent e) {
        int _hue = e.getY() * 360 / h;
        hue = Math.max(0, Math.min(359, _hue));
        repaint();

        if (selecter != null) {
            selecter.setHue(hue);
        }
    }

        mouseSelect(e);
    }

    public void mouseDragged(MouseEvent e) {
        mousePressed(e);
    }

    this.setHue = function(h) {
        hue = h;
        paint();
    };
}

function CPColorShow(cpController) {
    "use strict";
    
    var
        color,
        
        that = this;

    addMouseListener(this);

    cpController.on("colorChange", function() {
        color = color.getRgb();
        that.paint();
    });
    
    public void paint(Graphics g) {
        Dimension d = getSize();
        g.setColor(new Color(color));
        g.fillRect(0, 0, d.width, d.height);
    }

    public void mousePressed(MouseEvent e) {
        String colHex = "#" + padLeft(Integer.toString(color, 16), '0', 6);

        String result = JOptionPane.showInputDialog(this,
                "Please enter a color in hex format", colHex);

        if (result != null) {
            try {
                if (result.startsWith("#") || result.startsWith("$")) {
                    result = result.substring(1);
                }

                int newColor = Integer.parseInt(result, 16);

                controller.setCurColor(new CPColor(newColor));
            } catch (NumberFormatException ex) {
            }
        }
    }

    private static String padLeft(String string, char c, int len) {
        while (string.length() < len) {
            string = c + string;
        }
        return string;
    }
}*/

CPColorPalette.prototype = Object.create(CPPalette.prototype);
CPColorPalette.prototype.constructor = CPColorPalette;
