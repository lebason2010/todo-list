"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Edit, CheckCircle, XCircle, ArrowUpDown, Search, Plus, Save } from "lucide-react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

// Định nghĩa cấu trúc công việc
interface Task {
  id: number;
  text: string;
  deadline: string;
  status: "pending" | "completed";
  category: 'Học tập' | 'Công việc' | 'Gia đình'; 
  finished_time: string | null;
}

type SortKey = keyof Task;

export default function TodoApp() {
  const { isLoaded, isSignedIn, user } = useUser();

  // --- KHAI BÁO STATE ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Form
  const [inputText, setInputText] = useState("");
  const [inputDeadline, setInputDeadline] = useState("");
  // 1. THÊM STATE CHO CATEGORY (Mặc định là Công việc)
  const [inputCategory, setInputCategory] = useState<'Học tập' | 'Công việc' | 'Gia đình'>("Công việc"); // <--- THAY ĐỔI
  
  const [isEditingId, setIsEditingId] = useState<number | null>(null);

  // State cho Tìm kiếm & Sắp xếp
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  // --- HÀM BỔ SUNG: LẤY MÀU CHO CATEGORY ---
  const getCategoryColor = (cat: string) => { // <--- THAY ĐỔI
    switch (cat) {
      case 'Học tập': return 'bg-red-100 text-red-700 border-red-200';
      case 'Công việc': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Gia đình': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // --- LOGIC LẤY DỮ LIỆU (READ) ---
  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = isSignedIn && user ? `todo_data_${user.id}` : "todo_data_guest";
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        setTasks(JSON.parse(savedData));
      } catch (e) {
        console.error("Lỗi đọc dữ liệu cũ", e);
        setTasks([]);
      }
    } else {
      setTasks([]);
    }
    setLoading(false);
  }, [isLoaded, isSignedIn, user]);

  // --- LOGIC LƯU DỮ LIỆU (WRITE) ---
  useEffect(() => {
    if (loading || !isLoaded) return;
    const storageKey = isSignedIn && user ? `todo_data_${user.id}` : "todo_data_guest";
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks, loading, isLoaded, isSignedIn, user]);

  // --- CÁC HÀM XỬ LÝ (CRUD) ---
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !inputDeadline) return alert("Vui lòng điền đủ thông tin!");

    if (isEditingId) {
      // Sửa: Cập nhật cả category
      setTasks(tasks.map((t) => 
        t.id === isEditingId ? { 
            ...t, 
            text: inputText, 
            deadline: inputDeadline,
            category: inputCategory // <--- THAY ĐỔI: Lưu category khi sửa
        } : t
      ));
      setIsEditingId(null);
    } else {
      // Thêm mới: Bao gồm category
      const newTask: Task = {
        id: Date.now(),
        text: inputText,
        deadline: inputDeadline,
        status: "pending",
        category: inputCategory, // <--- THAY ĐỔI: Lưu category khi tạo mới
        finished_time: null,
      };
      setTasks([...tasks, newTask]);
    }
    // Reset form
    setInputText("");
    setInputDeadline("");
    setInputCategory("Công việc"); // <--- THAY ĐỔI: Reset về mặc định
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const startEdit = (task: Task) => {
    setIsEditingId(task.id);
    setInputText(task.text);
    setInputDeadline(task.deadline);
    setInputCategory(task.category); // <--- THAY ĐỔI: Load category cũ lên để sửa
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = (id: number) => {
    setTasks(tasks.map((t) => {
      if (t.id === id) {
        const isNewCompleted = t.status === "pending";
        return {
          ...t,
          status: isNewCompleted ? "completed" : "pending",
          finished_time: isNewCompleted ? new Date().toLocaleString() : null,
        };
      }
      return t;
    }));
  };

  // --- LOGIC LỌC VÀ SẮP XẾP ---
  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedTasks = React.useMemo(() => {
    let result = tasks.filter((t) => 
      t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) // <--- THAY ĐỔI: Cho phép tìm kiếm theo category
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";
        if (aValue === null) aValue = "";
        if (bValue === null) bValue = "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, searchTerm, sortConfig]);

  if (!isLoaded || loading) return <div className="h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        <header className="bg-red-400 p-6 text-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Quản Lý Công Việc</h1>
            <p className="opacity-90 text-sm mt-1">
              {isSignedIn ? `Xin chào, ${user.fullName || "User"}!` : "Chế độ Khách (Lưu trên máy này)"}
            </p>
          </div>
          <div className="bg-white text-black px-4 py-2 rounded-lg font-medium shadow">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden md:inline">Tài khoản</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="font-bold hover:underline">Đăng nhập</button>
              </SignInButton>
            )}
          </div>
        </header>

        {!isSignedIn && (
          <div className="bg-yellow-50 text-yellow-800 p-3 text-sm text-center border-b border-yellow-200">
            Bạn đang dùng chế độ Khách. Dữ liệu chỉ lưu trên trình duyệt này.
          </div>
        )}

        <div className="p-6">
          {/* Form nhập liệu */}
          <form onSubmit={handleSaveTask} className="flex flex-col lg:flex-row gap-4 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100 items-end">
            
            {/* Input Tên */}
            <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 mb-1 block">Nội dung</label>
                <input
                type="text"
                placeholder="Nhập công việc..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                />
            </div>

            {/* Input Category (Select Box Mới) */}
            <div className="w-full lg:w-48">
                <label className="text-xs text-gray-500 mb-1 block">Phân loại</label> {/* <--- THAY ĐỔI */}
                <select
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer"
                    value={inputCategory}
                    onChange={(e) => setInputCategory(e.target.value as any)}
                >
                    <option value="Công việc">🔵 Công việc</option>
                    <option value="Học tập">🔴 Học tập</option>
                    <option value="Gia đình">🟡 Gia đình</option>
                </select>
            </div>

            {/* Input Deadline */}
            <div className="w-full lg:w-auto">
                <label className="text-xs text-gray-500 mb-1 block">Hạn chót</label>
                <input
                type="date"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                value={inputDeadline}
                onChange={(e) => setInputDeadline(e.target.value)}
                />
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition w-full lg:w-auto ${
                isEditingId ? "bg-yellow-400 hover:bg-yellow-500" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isEditingId ? <><Save size={20} /> Lưu</> : <><Plus size={20} /> Thêm</>}
            </button>
            
            {isEditingId && (
              <button type="button" onClick={() => { setIsEditingId(null); setInputText(""); setInputDeadline(""); setInputCategory("Công việc"); }} className="px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                Hủy
              </button>
            )}
          </form>

          {/* Tìm kiếm */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm công việc, loại..."
                className="w-full pl-10 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Bảng dữ liệu */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-left border-collapse bg-white">
              <thead className="bg-gray-100 text-gray-700 uppercase text-sm font-semibold">
                <tr>
                  {/* Cột Category Mới */}
                  <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort("category")}>Loại <ArrowUpDown size={14} className="inline"/></th>
                  <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort("text")}>Công việc <ArrowUpDown size={14} className="inline"/></th>
                  <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort("deadline")}>Deadline <ArrowUpDown size={14} className="inline"/></th>
                  <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort("status")}>Trạng thái <ArrowUpDown size={14} className="inline"/></th>
                  <th className="p-4 cursor-pointer hover:bg-gray-200" onClick={() => handleSort("finished_time")}>Ngày xong <ArrowUpDown size={14} className="inline"/></th>
                  <th className="p-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedTasks.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">Không có dữ liệu phù hợp.</td></tr>
                ) : (
                  filteredAndSortedTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-gray-50 transition ${task.status === "completed" ? "bg-green-50" : ""}`}>
                      
                      {/* Hiển thị Category với màu sắc */}
                      <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCategoryColor(task.category)}`}> {/* <--- THAY ĐỔI */}
                              {task.category}
                          </span>
                      </td>

                      <td className={`p-4 font-medium ${task.status === "completed" ? "line-through text-gray-400" : ""}`}>{task.text}</td>
                      <td className="p-4 text-red-500 font-medium">{task.deadline}</td>
                      
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${task.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {task.status === "completed" ? "Hoàn thành" : "Đang làm"}
                        </span>
                      </td>
                      
                      <td className="p-4 text-sm text-gray-500">{task.finished_time || "-"}</td>
                      
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => toggleStatus(task.id)} className={`p-2 rounded text-white ${task.status === "completed" ? "bg-gray-400" : "bg-green-500"}`} title="Đổi trạng thái">
                          {task.status === "completed" ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button onClick={() => startEdit(task)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600" title="Sửa">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600" title="Xóa">
                            <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}