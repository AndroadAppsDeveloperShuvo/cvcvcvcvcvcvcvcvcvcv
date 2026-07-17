/* 💊 MULTI-BIRD MEDICINE MANAGER (Search, Color Fix & Safe Offline Support) */

let allMedicinesData = [];
let currentBirdType = 'broiler'; 

function normalizeBirdType(type) {
    if (!type) return 'broiler';
    type = String(type).trim().toLowerCase(); 
    
    if (type.includes('ব্রয়লার') || type.includes('ব্রয়লার') || type.includes('বয়লার') || type.includes('broiler')) return 'broiler';
    if (type.includes('কালার') || type.includes('color')) return 'color_bird';
    if (type.includes('সোনালি') || type.includes('সোনালী') || type.includes('sonali')) return 'sonali';
    if (type.includes('দেশি') || type.includes('দেশী') || type.includes('deshi')) return 'deshi';
    
    return 'broiler'; 
}

function initMedicines() {
    const container = document.getElementById('medicineListContainer');
    if(container) container.innerHTML = `<div class="text-center py-10 opacity-50">লোড হচ্ছে...</div>`;

    // 💡 ১. আগে অফলাইনের সেভ করা ওষুধের ডাটা লোড করবে
    const offlineMeds = localStorage.getItem('offline_medicines_data');
    if (offlineMeds) {
        allMedicinesData = JSON.parse(offlineMeds);
        renderFilteredMedicines();
    }

    // 💡 ২. ইন্টারনেট থাকলে ফায়ারবেস থেকে লাইভ ডাটা এনে আপডেট করবে এবং ফোনে সেভ করে রাখবে
    let activeDb = window.medDb || (typeof medDb !== 'undefined' ? medDb : null);
    if (!activeDb && typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        activeDb = firebase.database();
    }
    if (activeDb) {
        activeDb.ref('admin_medicines').on('value', snapshot => {
            const data = snapshot.val();
            let tempMeds = [];
            
            if (data) {
                Object.values(data).forEach(item => {
                    item.internalBirdType = normalizeBirdType(item.birdType);
                    item.day = String(item.day || "1"); 
                    tempMeds.push(item);
                });
            }
            allMedicinesData = tempMeds;
            localStorage.setItem('offline_medicines_data', JSON.stringify(allMedicinesData)); // ফোনে সেভ
            renderFilteredMedicines();
        });
    }
}

function setBirdFilter(rawType) {
    currentBirdType = normalizeBirdType(rawType);

    const searchInput = document.getElementById('medicineSearch');
    if(searchInput) searchInput.value = '';

    document.querySelectorAll('.bird-filter-btn').forEach(btn => {
        const btnType = normalizeBirdType(btn.dataset.type);
        if(btnType === currentBirdType) {
            btn.className = "bird-filter-btn px-4 py-2 rounded-full bg-teal-700 text-white text-xs font-bold whitespace-nowrap shadow-md transition transform scale-105";
        } else {
            btn.className = "bird-filter-btn px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold whitespace-nowrap transition";
        }
    });

    renderFilteredMedicines();
}

function renderFilteredMedicines() {
    const container = document.getElementById('medicineListContainer');
    const searchInput = document.getElementById('medicineSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if(!container) return;
    container.innerHTML = '';

    let filtered = allMedicinesData.filter(m => m.internalBirdType === currentBirdType);

    if (searchTerm !== '') {
        filtered = filtered.filter(item => {
            const searchString = `${item.medicine} ${item.day} ${item.time} ${item.note || ''}`.toLowerCase();
            return searchString.includes(searchTerm);
        });
    }

    if (filtered.length === 0) {
        if (searchTerm !== '') {
            container.innerHTML = `<div class="text-center py-16 opacity-50"><span class="material-symbols-outlined text-5xl mb-2 text-teal-600">search_off</span><p>কোনো ফলাফল পাওয়া যায়নি!</p></div>`;
        } else {
            container.innerHTML = `<div class="text-center py-20 opacity-50"><span class="material-symbols-outlined text-6xl mb-2">inventory_2</span><p>এই জাতের জন্য কোনো ওষুধ যোগ করা হয়নি</p></div>`;
        }
        return;
    }

    const grouped = {};
    filtered.forEach(item => {
        const days = String(item.day).split("→").map(d => d.trim());
        days.forEach(d => {
            if(!grouped[d]) grouped[d] = [];
            grouped[d].push(item);
        });
    });

    const dayStyles = [
        { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-400" },
        { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-400" },
        { bg: "bg-sky-50 dark:bg-sky-900/10", border: "border-sky-200 dark:border-sky-800", text: "text-sky-700 dark:text-sky-400" },
        { bg: "bg-rose-50 dark:bg-rose-900/10", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-400" }
    ];

    Object.keys(grouped).sort((a,b) => parseInt(a) - parseInt(b)).forEach((day, idx) => {
        const style = dayStyles[idx % dayStyles.length];
        const sec = document.createElement("div"); 
        sec.className = "space-y-3";
        sec.innerHTML = `<div class="flex items-center gap-3 mb-4"><span class="bg-teal-700 text-white px-3 py-1 rounded-full text-xs font-bold">দিন ${day}</span><div class="h-[1px] bg-gray-200 dark:bg-gray-700 flex-grow"></div></div>`;
        
        grouped[day].sort((a,b) => (a.serial||0) - (b.serial||0)).forEach(item => {
            sec.innerHTML += `
            <div class="p-5 border ${style.border} ${style.bg} rounded-3xl transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-lg flex items-center gap-2 dark:text-gray-100"><span class="material-symbols-outlined text-teal-700 dark:text-teal-400">medication</span>${item.medicine}</h4>
                    <span class="text-[10px] font-bold uppercase ${style.text} bg-white dark:bg-black/30 px-2 py-1 rounded-lg">${item.time}</span>
                </div>
                <div class="flex items-center gap-2 text-sm opacity-80 mb-2 dark:text-gray-300">
                    <span class="material-symbols-outlined text-sm">scale</span>পরিমাণ: ${item.amount}
                </div>
                ${item.note ? `<div class="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex gap-2"><span class="material-symbols-outlined text-sm text-red-500">info</span><p class="text-xs text-red-600 dark:text-red-400 font-medium"><b>বি:দ্র:</b> ${item.note}</p></div>` : ""}
            </div>`;
        });
        container.appendChild(sec);
    });
}

setTimeout(initMedicines, 500); 
