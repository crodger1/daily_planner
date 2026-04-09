import { useState, useEffect, useCallback } from "react";

const BUCKETS = [
  { emoji: "🔍", label: "Job Search", color: "#2D4A3E" },
  { emoji: "🤝", label: "Networking", color: "#3D3D5C" },
  { emoji: "📋", label: "Caregiving / Legal / Estate", color: "#5C3D2E" },
  { emoji: "🔨", label: "Home / Freelance / Skills", color: "#4A3D2D" },
  { emoji: "💪", label: "Wellness", color: "#2E4A3D" },
  { emoji: "🃏", label: "Wildcard / Overflow", color: "#4A2D3D" },
];

const SCHEDULE = [
  { time: "9:00 – 10:30am", label: "Morning Ramp", desc: "Ease in. Coffee, news, light admin. Caregiver check-ins.", icon: "🌅" },
  { time: "10:30am – 1:00pm", label: "Peak Focus Block", desc: "Job search — protected time. No scrolling, no distractions.", icon: "🎯" },
  { time: "1:00 – 2:00pm", label: "Midday Break", desc: "Lunch, walk, something non-screen. Non-negotiable.", icon: "🥗" },
  { time: "2:00 – 5:00pm", label: "Afternoon Block", desc: "Freelance, skills, legal tasks, home maintenance, caregiving.", icon: "🔨" },
  { time: "~5:00pm", label: "Buddy Check-In", desc: "10 min with your accountability partner. Log wins + tomorrow's #1 goal.", icon: "🔄" },
];

const FOCUS_ROTATION = [
  { day: "Mon", focus: "Applications & tailoring materials" },
  { day: "Tue", focus: "Networking & outreach" },
  { day: "Wed", focus: "Applications & tailoring materials" },
  { day: "Thu", focus: "Networking & outreach" },
  { day: "Fri", focus: "Research, job boards, week review" },
];

const BUDDY_FIELDS = [
  { key: "completed", label: "✅ Tasks I completed today", placeholder: "Which of your 6 did you finish?" },
  { key: "carryover", label: "➡️ Carrying over to tomorrow", placeholder: "Which tasks roll forward?" },
  { key: "win", label: "🏆 One real win from today", placeholder: "Something you moved forward, however small..." },
  { key: "blocker", label: "⚡ One thing that got in the way", placeholder: "What slowed you down? Pattern to address?" },
  { key: "priority", label: "🎯 Tomorrow's #1 priority task", placeholder: "The single most important thing for tomorrow..." },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultTasks = () =>
  BUCKETS.map((b, i) => ({ id: i, bucket: b, text: "", done: false }));

const defaultBuddy = () =>
  Object.fromEntries(BUDDY_FIELDS.map((f) => [f.key, ""]));

function getDayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatHistoryDate(key) {
  return new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function DailyPlanner() {
  const [tasks, setTasks] = useState(defaultTasks());
  const [buddy, setBuddy] = useState(defaultBuddy());
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("tasks");
  const [loading, setLoading] = useState(true);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [viewingDate, setViewingDate] = useState(null);
  const [viewingData, setViewingData] = useState(null);

  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const todayFocus = FOCUS_ROTATION.find((r) => r.day === todayDay);
  const completed = tasks.filter((t) => t.done).length;

  useEffect(() => {
    const load = async () => {
      try {
        const taskResult = await window.storage.get(`tasks:${todayKey()}`);
        if (taskResult) setTasks(JSON.parse(taskResult.value));
      } catch {}
      try {
        const buddyResult = await window.storage.get(`buddy:${todayKey()}`);
        if (buddyResult) setBuddy(JSON.parse(buddyResult.value));
      } catch {}
      try {
        const histResult = await window.storage.get("history:index");
        if (histResult) setHistory(JSON.parse(histResult.value));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const flashSaved = () => {
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1800);
  };

  const saveTasks = useCallback(async (updated) => {
    try {
      await window.storage.set(`tasks:${todayKey()}`, JSON.stringify(updated));
      flashSaved();
    } catch {}
  }, []);

  const updateTask = (id, field, value) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, [field]: value } : t));
    setTasks(updated);
    if (field === "done") saveTasks(updated);
  };

  const updateBuddy = (key, value) => {
    setBuddy((prev) => ({ ...prev, [key]: value }));
  };

  const saveBuddyNow = async () => {
    try {
      await window.storage.set(`buddy:${todayKey()}`, JSON.stringify(buddy));
      const key = todayKey();
      const newHistory = history.includes(key) ? history : [key, ...history].slice(0, 30);
      await window.storage.set("history:index", JSON.stringify(newHistory));
      setHistory(newHistory);
      flashSaved();
    } catch {}
  };

  const carryOver = async () => {
    try {
      const key = todayKey();
      const snapshot = { tasks, buddy, date: key };
      await window.storage.set(`archive:${key}`, JSON.stringify(snapshot));
      const newHistory = history.includes(key) ? history : [key, ...history].slice(0, 30);
      await window.storage.set("history:index", JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch {}
    const incomplete = tasks.filter((t) => !t.done);
    const complete = tasks.filter((t) => t.done);
    const reordered = [...incomplete, ...complete.map((t) => ({ ...t, done: false, text: "" }))].slice(0, 6).map((t, i) => ({ ...t, id: i }));
    setTasks(reordered);
    setBuddy(defaultBuddy());
    await saveTasks(reordered);
    flashSaved();
  };

  const resetDay = async () => {
    const fresh = defaultTasks();
    setTasks(fresh);
    setBuddy(defaultBuddy());
    await saveTasks(fresh);
  };

  const loadHistoryDay = async (dateKey) => {
    try {
      const res = await window.storage.get(`archive:${dateKey}`);
      if (res) {
        setViewingData(JSON.parse(res.value));
        setViewingDate(dateKey);
        setTab("history-detail");
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#9A8E7A", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase" }}>
        Loading your planner...
      </div>
    );
  }

  const tabStyle = (id) => ({
    padding: "12px 20px", border: "none",
    background: (tab === id || (tab === "history-detail" && id === "history")) ? "#1A1A1A" : "transparent",
    color: (tab === id || (tab === "history-detail" && id === "history")) ? "#F5F0E8" : "#5A5040",
    fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase",
    cursor: "pointer", borderRight: "1px solid #D4C9B0", whiteSpace: "nowrap", transition: "all 0.15s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", fontFamily: "'Georgia', 'Times New Roman', serif", color: "#1A1A1A" }}>

      {/* Header */}
      <div style={{ background: "#1A1A1A", color: "#F5F0E8", padding: "28px 32px 22px", borderBottom: "4px solid #C8A96E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96E", marginBottom: "6px" }}>Daily Structure & Ivy Lee Planner</div>
            <div style={{ fontSize: "26px", fontWeight: "normal" }}>{getDayLabel()}</div>
            {todayFocus && (
              <div style={{ marginTop: "8px", fontSize: "13px", color: "#A0A0A0" }}>
                Today's focus: <span style={{ color: "#C8A96E" }}>{todayFocus.focus}</span>
              </div>
            )}
          </div>
          {savedIndicator && (
            <div style={{ fontSize: "11px", color: "#C8A96E", letterSpacing: "2px", textTransform: "uppercase", paddingTop: "4px" }}>✓ Saved</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #D4C9B0", background: "#EDE8DC", overflowX: "auto" }}>
        {[
          { id: "tasks", label: "Today's 6" },
          { id: "schedule", label: "Daily Structure" },
          { id: "buddy", label: "Buddy Check-In" },
          { id: "history", label: `History (${history.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tabStyle(t.id)}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "28px 24px" }}>

        {/* TASKS */}
        {tab === "tasks" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A" }}>Progress</span>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: completed >= 3 ? "#2D4A3E" : "#1A1A1A" }}>{completed} / 6 {completed >= 3 && "✓"}</span>
              </div>
              <div style={{ height: "6px", background: "#D4C9B0", borderRadius: "3px" }}>
                <div style={{ height: "100%", width: `${(completed / 6) * 100}%`, background: completed >= 3 ? "#2D4A3E" : "#C8A96E", borderRadius: "3px", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#9A8E7A", marginTop: "5px" }}>Daily win = complete tasks 1–3 · Tasks 4–6 carry over if needed</div>
            </div>

            {tasks.map((task, idx) => (
              <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 16px", marginBottom: "8px", background: task.done ? "#E8F0EC" : idx < 3 ? "#FFFFFF" : "#EDE8DC", border: `1px solid ${task.done ? "#B0D4BC" : idx < 3 ? "#C8A96E" : "#D4C9B0"}`, borderLeft: `4px solid ${task.done ? "#2D4A3E" : task.bucket.color}`, borderRadius: "4px", opacity: task.done ? 0.75 : 1, transition: "all 0.2s" }}>
                <div style={{ minWidth: "24px", height: "24px", borderRadius: "50%", background: idx < 3 ? "#1A1A1A" : "#9A8E7A", color: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", marginTop: "2px", flexShrink: 0 }}>{idx + 1}</div>
                <input type="checkbox" checked={task.done} onChange={(e) => updateTask(task.id, "done", e.target.checked)} style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0, accentColor: "#2D4A3E" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#9A8E7A", marginBottom: "5px" }}>
                    {task.bucket.emoji} {task.bucket.label}
                    {idx < 3 && <span style={{ color: "#C8A96E", marginLeft: "8px" }}>● Priority</span>}
                    {idx >= 3 && <span style={{ marginLeft: "8px" }}>· Carry-over if needed</span>}
                  </div>
                  <input type="text" value={task.text}
                    onChange={(e) => updateTask(task.id, "text", e.target.value)}
                    onBlur={() => saveTasks(tasks)}
                    placeholder={`Enter task for: ${task.bucket.label}...`}
                    style={{ width: "100%", border: "none", background: "transparent", fontFamily: "inherit", fontSize: "15px", color: task.done ? "#6A8A74" : "#1A1A1A", textDecoration: task.done ? "line-through" : "none", outline: "none", padding: "0" }} />
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              <button onClick={carryOver} style={{ padding: "10px 20px", background: "#1A1A1A", color: "#F5F0E8", border: "none", fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
                Archive & Carry Over →
              </button>
              <button onClick={resetDay} style={{ padding: "10px 20px", background: "transparent", color: "#7A6E5A", border: "1px solid #C8B89A", fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
                Reset Day
              </button>
            </div>
            <div style={{ marginTop: "12px", fontSize: "11px", color: "#9A8E7A", lineHeight: "1.6" }}>
              Tasks save automatically when you check them off or click away. Hit <strong>Archive & Carry Over</strong> at end of day to log to History and promote incomplete tasks.
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {tab === "schedule" && (
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "20px" }}>Daily Rhythm</div>
            {SCHEDULE.map((block, i) => (
              <div key={i} style={{ display: "flex", gap: "20px", marginBottom: "4px", padding: "16px", background: i % 2 === 0 ? "#FFFFFF" : "#F5F0E8", border: "1px solid #D4C9B0", borderLeft: i === 1 ? "4px solid #C8A96E" : "4px solid transparent" }}>
                <div style={{ minWidth: "130px", fontSize: "11px", color: "#9A8E7A", paddingTop: "2px" }}>{block.time}</div>
                <div>
                  <div style={{ fontSize: "15px", marginBottom: "4px" }}>
                    {block.icon} {block.label}
                    {i === 1 && <span style={{ fontSize: "10px", color: "#C8A96E", marginLeft: "8px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Protected</span>}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6A6050", lineHeight: "1.5" }}>{block.desc}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: "28px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "14px" }}>Weekly Job Search Focus</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {FOCUS_ROTATION.map((r) => (
                  <div key={r.day} style={{ padding: "10px 14px", background: r.day === todayDay ? "#1A1A1A" : "#FFFFFF", color: r.day === todayDay ? "#F5F0E8" : "#1A1A1A", border: "1px solid #D4C9B0", borderRadius: "2px", fontSize: "12px", flex: "1", minWidth: "120px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: r.day === todayDay ? "#C8A96E" : "#9A8E7A" }}>{r.day}</div>
                    {r.focus}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BUDDY */}
        {tab === "buddy" && (
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "6px" }}>End-of-Day Accountability Check-In</div>
            <div style={{ fontSize: "13px", color: "#6A6050", marginBottom: "24px" }}>Fill this out before your ~5pm call, then hit Save. It'll be logged to History.</div>
            {BUDDY_FIELDS.map((field) => (
              <div key={field.key} style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", color: "#3A3020" }}>{field.label}</div>
                <textarea value={buddy[field.key]} onChange={(e) => updateBuddy(field.key, e.target.value)} placeholder={field.placeholder} rows={3}
                  style={{ width: "100%", padding: "12px", fontFamily: "inherit", fontSize: "14px", background: "#FFFFFF", border: "1px solid #C8B89A", borderRadius: "2px", color: "#1A1A1A", resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box" }} />
              </div>
            ))}
            <button onClick={saveBuddyNow} style={{ padding: "10px 24px", background: "#1A1A1A", color: "#F5F0E8", border: "none", fontFamily: "inherit", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px" }}>
              Save Check-In
            </button>
            <div style={{ padding: "16px", background: "#1A1A1A", color: "#C8A96E", fontSize: "13px", lineHeight: "1.7", borderRadius: "2px", marginTop: "20px" }}>
              💬 <strong>Reminder:</strong> Keep the call to 10 minutes. Share your one win, one blocker, and tomorrow's #1. No problem-solving — just witness and affirm.
            </div>
          </div>
        )}

        {/* HISTORY LIST */}
        {tab === "history" && (
          <div>
            <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "20px" }}>Archived Days ({history.length})</div>
            {history.length === 0 ? (
              <div style={{ color: "#9A8E7A", fontSize: "14px", lineHeight: "1.7", padding: "20px", background: "#FFFFFF", border: "1px solid #D4C9B0" }}>
                No archived days yet. At the end of each day, hit <strong>"Archive & Carry Over"</strong> on the Today's 6 tab to save your progress here.
              </div>
            ) : (
              history.map((dateKey) => (
                <button key={dateKey} onClick={() => loadHistoryDay(dateKey)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "14px 18px", marginBottom: "6px", background: "#FFFFFF", border: "1px solid #D4C9B0", borderLeft: "4px solid #C8A96E", fontFamily: "inherit", fontSize: "14px", color: "#1A1A1A", cursor: "pointer", textAlign: "left", borderRadius: "2px" }}>
                  <span>{formatHistoryDate(dateKey)}</span>
                  <span style={{ fontSize: "11px", color: "#9A8E7A", letterSpacing: "1px", textTransform: "uppercase" }}>View →</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* HISTORY DETAIL */}
        {tab === "history-detail" && viewingData && (
          <div>
            <button onClick={() => setTab("history")} style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: "12px", color: "#7A6E5A", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", marginBottom: "20px", padding: "0" }}>← Back</button>
            <div style={{ fontSize: "18px", marginBottom: "20px" }}>{formatHistoryDate(viewingDate)}</div>
            <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "12px" }}>Tasks</div>
            {viewingData.tasks.map((task, idx) => (
              <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", marginBottom: "6px", background: task.done ? "#E8F0EC" : "#FFFFFF", border: "1px solid #D4C9B0", borderLeft: `4px solid ${task.done ? "#2D4A3E" : "#C8B89A"}`, borderRadius: "2px", opacity: task.text ? 1 : 0.4 }}>
                <span style={{ fontSize: "16px" }}>{task.done ? "✓" : "○"}</span>
                <div>
                  <div style={{ fontSize: "10px", color: "#9A8E7A", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>{task.bucket.emoji} {task.bucket.label}</div>
                  <div style={{ fontSize: "14px", textDecoration: task.done ? "line-through" : "none", color: task.done ? "#6A8A74" : "#1A1A1A" }}>{task.text || <em style={{ color: "#C8B89A" }}>No task entered</em>}</div>
                </div>
              </div>
            ))}
            {viewingData.buddy && Object.values(viewingData.buddy).some(v => v) && (
              <div style={{ marginTop: "28px" }}>
                <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#7A6E5A", marginBottom: "12px" }}>Buddy Check-In Notes</div>
                {BUDDY_FIELDS.map((field) => viewingData.buddy[field.key] ? (
                  <div key={field.key} style={{ marginBottom: "14px", padding: "14px", background: "#FFFFFF", border: "1px solid #D4C9B0" }}>
                    <div style={{ fontSize: "11px", color: "#9A8E7A", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>{field.label}</div>
                    <div style={{ fontSize: "14px", lineHeight: "1.6" }}>{viewingData.buddy[field.key]}</div>
                  </div>
                ) : null)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
