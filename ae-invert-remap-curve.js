app.beginUndoGroup("Restore Exact Original Speed");

// Get the active composition
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    alert("No active composition.");
} else {
    var layer = comp.selectedLayers[0];
    if (!layer) {
        alert("No layer selected.");
    } else {
        // Duplicate the layer
        var duplicate = layer.duplicate();
        duplicate.name = layer.name + "_ExactOriginalSpeed";

        duplicate.timeRemapEnabled = true;
        var prop = duplicate.property("ADBE Time Remapping");
        var originalProp = layer.property("ADBE Time Remapping");

        var layerIn = duplicate.inPoint;
        var layerOut = duplicate.outPoint;
        var fps = comp.frameRate;
        var frameCount = Math.ceil((layerOut - layerIn) * fps);

        // Remove all existing keys except the first and last
        for (var k = prop.numKeys - 1; k >= 2; k--) {
            prop.removeKey(k);
        }

        // Inverse search function using binary search (dichotomy)
        function findInverse(t, originalProp, layerIn, layerOut, tol) {
            var low = layerIn;
            var high = layerOut;
            var mid;
            tol = tol || (1/comp.frameRate)/10; // very small tolerance
            var val;
            var maxIter = 50;
            var iter = 0;
            while (iter < maxIter) {
                mid = (low + high) / 2;
                val = originalProp.valueAtTime(mid, false);
                var diff = val - t;
                if (Math.abs(diff) < tol) break;
                if (diff > 0) {
                    high = mid;
                } else {
                    low = mid;
                }
                iter++;
            }
            return mid;
        }

        // Apply inverse remapping frame by frame
        for (var i = 0; i <= frameCount; i++) {
            var t = layerIn + i / fps;
            var originalTime = findInverse(t, originalProp, layerIn, layerOut);
            try {
                prop.setValueAtTime(t, originalTime - layerIn);
            } catch (err) {
                $.writeln("Error on frame " + i + ": " + err.toString());
            }
        }

        alert("Duplicate created: exact original speed restored.");
    }
}

app.endUndoGroup();