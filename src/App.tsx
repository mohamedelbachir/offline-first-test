import React, { useState, useEffect } from "react";
function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>();
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    // Open IndexedDB when component mounts
    openDatabase();
    // Load saved files from IndexedDB when component mounts
    loadSavedFiles();
  }, [db]);

  // Function to open IndexedDB
  const openDatabase = () => {
    const request = indexedDB.open("offline_storage_db", 1);
    request.onerror = () => {
      console.error("Error opening database:", request.error);
    };
    request.onsuccess = () => {
      //console.log(request.source());

      const db = request.result;
      setDb(db);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("files", { autoIncrement: true });
    };
  };

  // Function to load saved files from IndexedDB
  const loadSavedFiles = () => {
    if (!db) return;
    const transaction = db.transaction(["files"], "readonly");
    const objectStore = transaction.objectStore("files");
    const cursor = objectStore.openCursor();

    const loadedFiles: File[] = [];
    cursor.onsuccess = function (event) {
      const elements = cursor.result;
      if (elements) {
        loadedFiles.push(elements.value);
        elements.continue();
      } else {
        setFiles(loadedFiles as File[]);
      }
    };
  };

  // Function to handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files === null) {
      return;
    }
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // Function to save file to IndexedDB
  const saveFile = () => {
    if (!db || !selectedFile) return;
    const transaction = db.transaction(["files"], "readwrite");
    const objectStore = transaction.objectStore("files");
    const addRequest = objectStore.add(selectedFile);

    addRequest.onsuccess = function (event) {
      console.log("File added to database");
      setFiles([...files, selectedFile]);
      setSelectedFile(null);
    };
  };

  return (
    <div>
      <h1>Offline File Storage</h1>
      <input type="file" onChange={handleFileInputChange} />
      <button onClick={saveFile}>Save File</button>
      <h2>Saved Files:</h2>
      <div>
        {files.map((file, index) => (
          <div key={index}>
            {file.type.startsWith("image") ? (
              <img src={URL.createObjectURL(file)} alt={file.name} />
            ) : file.type.startsWith("video") ? (
              <video controls>
                <source src={URL.createObjectURL(file)} type={file.type} />
              </video>
            ) : file.name.endsWith(".json") ? (
              <pre>{JSON.stringify(file, null, 2)}</pre>
            ) : (
              <div>{file.name}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
