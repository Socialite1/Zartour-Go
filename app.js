const supabase = supabase.createClient(
  "https://fzzxcshdetqruxquxrbe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enhjc2hkZXRxcnV4cXV4cmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjIyMDgsImV4cCI6MjA4OTM5ODIwOH0.5BjEQWW8n7k62Uw7_JhsmZlA9Anl-mKqFiWs2Wwlilc"
);

// QR provides this (example: ?task=abc123)
const params = new URLSearchParams(window.location.search);
const taskCode = params.get("task");

async function submitTask() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const file = document.getElementById("proof").files[0];

  // 1. Get or create user
  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from("users")
      .insert([{ name, phone }])
      .select()
      .single();

    user = newUser;
  }

  // 2. Get task
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("qr_code", taskCode)
    .single();

  // 3. Upload proof
  const filePath = `${user.id}/${Date.now()}_${file.name}`;
  await supabase.storage
    .from("proofs")
    .upload(filePath, file);

  const proofUrl = filePath;

  // 4. Save submission
  await supabase.from("submissions").insert([{
    user_id: user.id,
    task_id: task.id,
    proof_url: proofUrl,
    points_awarded: task.points
  }]);

  // 5. Update points
  let newPoints = user.points + task.points;

  // 6. STREAK LOGIC
  let today = new Date().toISOString().split("T")[0];
  let streak = user.streak || 0;

  if (user.last_active === today) {
    // already counted today
  } else {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toISOString().split("T")[0];

    if (user.last_active === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  await supabase.from("users").update({
    points: newPoints,
    streak: streak,
    last_active: today
  }).eq("id", user.id);

  alert("🔥 Points earned! Keep going!");
      }

    async function loadLeaderboard() {
  const { data } = await supabase
    .from("users")
    .select("name, points")
    .order("points", { ascending: false })
    .limit(10);

  console.log(data);
    }

