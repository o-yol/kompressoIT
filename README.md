# CompressIT

CompressIT is a web application that compresses and decompresses `.txt` files using Huffman coding, a lossless compression algorithm. The user selects a file, chooses an action, and gets the result downloaded straight away along with the original size, the new size and the percentage saved. Files are processed in the browser using the File API.

## Tech Stack

- **HTML5**: page structure
- **CSS3**: layout, responsive design, light and dark theme
- **JavaScript (ES6)**: application logic and the compression algorithm
- **Browser File API (`FileReader`, `Blob`)**: reading the selected file and generating the download
- **Algorithms and data structures**: Huffman coding, binary tree, min-heap (priority queue)

## Project Structure

| File | Purpose |
|---|---|
| `index.html` | Page layout: file picker, Compress and Decompress buttons, result panel |
| `styles.css` | Styling, responsive layout and light/dark theme |
| `app.js` | Handles user actions: validates the file, reads it, calls the codec, triggers the download and updates the result panel |
| `codec.js` | `Codec` class that implements Huffman encoding and decoding |
| `heap.js` | `MinHeap` class used by the codec to pick the two least frequent nodes |

## How It Works

**Compression**

1. The text is scanned and the frequency of every character is counted.
2. Each `[frequency, character]` pair is inserted into a min-heap.
3. The two lowest-frequency nodes are repeatedly removed and merged into a new node whose frequency is their sum, until a single node remains. This node is the root of the Huffman tree.
4. The tree is traversed (left branch = `0`, right branch = `1`) to assign each character a binary code. Frequent characters receive shorter codes.
5. Every character in the text is replaced by its code, the bit string is padded to a multiple of 8, and each group of 8 bits is packed into one character.
6. The output file is stored as `treeLength#padding#tree` followed by the packed data, so the tree can be rebuilt during decompression. Empty files and files with a single distinct character use a short special format.

**Decompression**

1. The header is read to get the tree length and the padding length.
2. The Huffman tree is rebuilt from its stored text form.
3. The packed characters are expanded back into a bit string and the padding bits are removed.
4. The bit string is walked through the tree from the root, going left on `0` and right on `1`. Each time a leaf is reached its character is written to the output and the walk restarts from the root.

**Application flow**

`index.html` loads `heap.js`, `codec.js` and `app.js` in that order. When the user selects a file, `app.js` checks that it is a `.txt` file. On Compress or Decompress, it reads the file with `FileReader`, passes the text to `Codec.encode()` or `Codec.decode()`, downloads the returned text as a new file and displays the size statistics.

**Complexity**

Counting characters and encoding are O(n). Building the tree takes O(k log k), where k is the number of distinct characters.
