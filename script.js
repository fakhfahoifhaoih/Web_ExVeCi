document.getElementById('mediaType').addEventListener('change', handleMediaTypeChange);
document.getElementById('encryptButton').addEventListener('click', () => processMedia('encrypt'));
document.getElementById('decryptButton').addEventListener('click', () => processMedia('decrypt'));

function handleMediaTypeChange() {
    const mediaType = document.getElementById('mediaType').value;
    const textInputContainer = document.getElementById('textInputContainer');
    const fileInputContainer = document.getElementById('fileInputContainer');
    const databaseInputContainer = document.getElementById('databaseInputContainer');
    if (mediaType === 'text') {
        textInputContainer.style.display = 'block';
        fileInputContainer.style.display = 'none';
        databaseInputContainer.style.display = 'none';
    }else if(mediaType==='database'){
        databaseInputContainer.style.display = 'block';
        fileInputContainer.style.display = 'none';
        textInputContainer.style.display = 'none';
    }else {
        textInputContainer.style.display = 'none';
        fileInputContainer.style.display = 'block';
        databaseInputContainer.style.display = 'none';
    }
}

function processMedia(action) {
    const mediaType = document.getElementById('mediaType').value;
    const key = document.getElementById('keyInput').value;
    const downloadLink = document.getElementById('downloadLink');

    if (!key) {
        alert('Harap masukkan kunci.');
        return;
    }

    if (mediaType === 'text') {
        const textInput = document.getElementById('textInput').value;
        if (!textInput) {
            alert('Harap masukkan teks.');
            return;
        }
        const result = vigenereCipher(textInput, key, action === 'encrypt');
        const textResult = document.getElementById('textResult');
        textResult.value = result;
        textResult.style.display = 'block';
        downloadLink.style.display = 'inline-block';
        downloadLink.href = `data:text/plain;charset=utf-8,${encodeURIComponent(result)}`;
        downloadLink.download = `${action}_text.txt`;
    }else if (mediaType === 'database') {
        const dbKeyInput = document.getElementById('dbKeyInput').value;
        if (!dbKeyInput) {
            alert('Harap masukkan data untuk database.');
            return;
        }

        // Enkripsi data untuk disimpan ke database
        const encryptedData = vigenereCipher(dbKeyInput, key, action === 'encrypt');

        // Kirim data terenkripsi ke API untuk disimpan dalam database
        fetch('http://localhost:5000/api/database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: encryptedData }),
        })
            .then(response => response.json())
            .then(result => {
                if (result.id) {
                    alert(`Data berhasil disimpan ke database dengan ID: ${result.id}`);
                } else {
                    alert('Terjadi kesalahan saat menyimpan data ke database.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Terjadi kesalahan saat menghubungi server.');
            });
    }else {
        const fileInput = document.getElementById('fileInput').files[0];
        if (!fileInput) {
            alert('Harap unggah file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const arrayBuffer = new Uint8Array(reader.result);
            for (let i = 0; i < arrayBuffer.length; i++) {
                arrayBuffer[i] = action === 'encrypt'
                    ? (arrayBuffer[i] + key.charCodeAt(i % key.length)) % 256
                    : (arrayBuffer[i] - key.charCodeAt(i % key.length) + 256) % 256;
            }

            const blob = new Blob([arrayBuffer], { type: fileInput.type });
            const url = URL.createObjectURL(blob);

            if (mediaType === 'audio') {
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = url;
                audioPlayer.style.display = 'block';
            } else if (mediaType === 'video') {
                const videoPlayer = document.getElementById('videoPlayer');
                videoPlayer.src = url;
                videoPlayer.style.display = 'block';
            }

            downloadLink.href = url;
            downloadLink.download = `${action}_${fileInput.name}`;
            downloadLink.style.display = 'inline-block';
        };
        reader.readAsArrayBuffer(fileInput);
    }
}

function vigenereCipher(input, key, encrypt = true) {
    const result = [];
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        const newCode = encrypt
            ? (charCode + keyCode) % 256
            : (charCode - keyCode + 256) % 256;
        result.push(String.fromCharCode(newCode));
    }
    return result.join('');
}
