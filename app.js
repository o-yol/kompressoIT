const fileInput     = document.getElementById("file-input");
const dropZone      = document.getElementById("drop-zone");
const fileLabel     = document.getElementById("file-label");
const notice        = document.getElementById("notice");
const compressBtn   = document.getElementById("compress-btn");
const decompressBtn = document.getElementById("decompress-btn");
const resultBox     = document.getElementById("result");
const statOriginal  = document.getElementById("stat-original");
const statOutput    = document.getElementById("stat-output");
const statChange    = document.getElementById("stat-change");
const statChangeLbl = document.getElementById("stat-change-label");
const resultMessage = document.getElementById("result-message");
const downloadLink  = document.getElementById("download-link");
const resetBtn      = document.getElementById("reset-btn");

const codec = new Codec();
let selectedFile = null;
let lastUrl = null;

function formatBytes(n) {
	if (n < 1024) return n + " B";
	if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
	return (n / (1024 * 1024)).toFixed(2) + " MB";
}

function showNotice(text, isError) {
	notice.textContent = text;
	notice.className = "notice" + (isError ? " error" : "");
	notice.hidden = false;
}

function hideNotice() {
	notice.hidden = true;
}

function looksCompressed(text) {
	return text.startsWith("zer#") || text.startsWith("one#") || /^\d+#\d+#/.test(text);
}

function handleFile(file) {
	hideNotice();
	resultBox.hidden = true;

	if (!file) return;

	const ext = file.name.split(".").pop().toLowerCase();
	if (ext !== "txt") {
		selectedFile = null;
		fileLabel.textContent = "Click to choose a file";
		dropZone.classList.remove("has-file");
		compressBtn.disabled = true;
		decompressBtn.disabled = true;
		showNotice("Invalid file type (." + ext + "). Please choose a .txt file.", true);
		return;
	}

	selectedFile = file;
	fileLabel.textContent = file.name + "  (" + formatBytes(file.size) + ")";
	dropZone.classList.add("has-file");
	compressBtn.disabled = false;
	decompressBtn.disabled = false;
}

fileInput.addEventListener("change", function () {
	handleFile(fileInput.files[0]);
});

dropZone.addEventListener("dragover", function (e) {
	e.preventDefault();
	dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", function () {
	dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", function (e) {
	e.preventDefault();
	dropZone.classList.remove("dragover");
	handleFile(e.dataTransfer.files[0]);
});

compressBtn.addEventListener("click", function () { runAction("compress"); });
decompressBtn.addEventListener("click", function () { runAction("decompress"); });

function runAction(mode) {
	if (!selectedFile) {
		showNotice("Please choose a .txt file first.", true);
		return;
	}

	hideNotice();

	if (mode === "compress") {
		if (selectedFile.size === 0) {
			showNotice("Warning: empty file. The output will be larger than the input.", false);
		} else if (selectedFile.size <= 350) {
			showNotice("Warning: very small file (" + selectedFile.size + " bytes). The output may be larger than the input. Bigger files compress better.", false);
		} else if (selectedFile.size < 1000) {
			showNotice("Small file (" + selectedFile.size + " bytes). Compression may be weak. Bigger files compress better.", false);
		}
	}

	compressBtn.disabled = true;
	decompressBtn.disabled = true;

	readFile(selectedFile, function (text) {
		let outputText, message;

		if (mode === "decompress" && !looksCompressed(text)) {
			showNotice("This does not look like a file compressed by this tool.", true);
			compressBtn.disabled = false;
			decompressBtn.disabled = false;
			return;
		}

		try {
			const result = (mode === "compress") ? codec.encode(text) : codec.decode(text);
			if (!result) return;
			outputText = result[0];
			message = result[1];
		} catch (err) {
			showNotice("Something went wrong: " + err.message, true);
			compressBtn.disabled = false;
			decompressBtn.disabled = false;
			return;
		}

		const baseName = selectedFile.name.replace(/\.[^.]*$/, "");
		const suffix = (mode === "compress") ? "_compressed.txt" : "_decompressed.txt";

		downloadFile(baseName + suffix, outputText);
		showResult(mode, selectedFile.size, outputText, message);

		compressBtn.disabled = false;
		decompressBtn.disabled = false;
	});
}

function readFile(file, onDone) {
	const reader = new FileReader();
	reader.onload = function (event) {
		onDone(event.target.result);
	};
	reader.readAsText(file, "UTF-8");
}

function downloadFile(fileName, text) {
	if (lastUrl) URL.revokeObjectURL(lastUrl);
	const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
	lastUrl = URL.createObjectURL(blob);

	downloadLink.href = lastUrl;
	downloadLink.download = fileName;
	downloadLink.click();
}

function showResult(mode, originalBytes, outputText, message) {
	const outputBytes = new Blob([outputText]).size;

	statOriginal.textContent = formatBytes(originalBytes);
	statOutput.textContent = formatBytes(outputBytes);
	statChange.className = "value";

	if (originalBytes === 0) {
		statChangeLbl.textContent = "Change";
		statChange.textContent = "-";
	} else {
		const pct = ((outputBytes - originalBytes) / originalBytes) * 100;
		if (mode === "compress") {
			statChangeLbl.textContent = pct <= 0 ? "Saved" : "Larger by";
			statChange.textContent = Math.abs(pct).toFixed(1) + "%";
			statChange.classList.add(pct <= 0 ? "good" : "worse");
		} else {
			statChangeLbl.textContent = "Size change";
			statChange.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
		}
	}

	resultMessage.textContent = message;
	resultBox.hidden = false;
}

resetBtn.addEventListener("click", function () {
	selectedFile = null;
	fileInput.value = "";
	fileLabel.textContent = "Click to choose a file";
	dropZone.classList.remove("has-file");
	compressBtn.disabled = true;
	decompressBtn.disabled = true;
	resultBox.hidden = true;
	hideNotice();
});
