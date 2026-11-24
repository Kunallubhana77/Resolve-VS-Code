# Resolve ko VS Code mein chalane ka tareeqa

## 1. Folder kholna

ZIP extract karo, phir VS Code mein **File → Open Folder** se `Resolve-VS-Code` folder select karo. Website ke liye koi npm install ya backend setup nahi chahiye.

## 2. Website chalana

VS Code mein **Terminal → New Terminal** kholo. Terminal ka current folder project root hona chahiye—jahan `index.html` aur `app.js` hain.

- Windows: `py -m http.server 3000` (agar `py` na chale to `python -m http.server 3000`)
- macOS/Linux: `python3 -m http.server 3000`

Browser mein `http://localhost:3000` kholo. Band karne ke liye terminal mein `Ctrl+C` dabao. Agar port 3000 busy ho to command mein `3000` ki jagah `8000` use karo aur `http://localhost:8000` kholo. Python ke badle VS Code ka Live Server extension bhi use kar sakte ho.

## 3. C++ DSA program chalana

C++17 `g++` compiler install/configure hona chahiye. VS Code terminal project root par kholkar:

**Windows PowerShell (MinGW/MSYS2 `g++` PATH mein ho):**

```powershell
g++ -std=c++17 -Wall -Wextra -pedantic .\cpp\complaint_system.cpp -o .\complaint-system.exe
.\complaint-system.exe
```

**macOS/Linux:**

```bash
g++ -std=c++17 -Wall -Wextra -pedantic cpp/complaint_system.cpp -o complaint-system
./complaint-system
```

Agar `g++` command nahi milta, pehle apne OS ke liye C++ compiler install karke PATH configure karo. Windows par MinGW-w64/MSYS2 ya WSL use kar sakte ho.

## 4. Demo ke baare mein

Website aur C++ program alag demos hain; website tickets isi browser ke `localStorage` mein save hote hain. Dusre browser/computer par woh data share nahi hota. Sample tickets wapas lane ke liye website ka **Reset demo data** button use karo.
