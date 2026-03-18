

const { createClient } = supabase;
const supabaseClient = createClient(
  "https://fzzxcshdetqruxquxrbe.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enhjc2hkZXRxcnV4cXV4cmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjIyMDgsImV4cCI6MjA4OTM5ODIwOH0.5BjEQWW8n7k62Uw7_JhsmZlA9Anl-mKqFiWs2Wwlilc"
  
);

// Get task from QR
const params = new URLSearchParams(window.location.search);
const taskCode = params.get("task");

async function submitTask() {
  try {
    // 🔹 Get form values
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;
    const place = document.getElementById("place").value;
    const knowledge = document.getElementById("knowledge").value;
    const file = document.getElementById("proof").files[0];

    if (!file) {
      alert("Upload proof image");
      return;
    }

    // 🔹 1. Get or create user
    let { data: user } = await supabaseClient
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (!user) {
      const { data: newUser } = await supabaseClient
        .from("users")
        .insert([{
          name,
          email,
          phone,
          address
        }])
        .select()
        .single();

      user = newUser;
    }

    // 🔹 2. Get task
    const { data: task } = await supabaseClient
      .from("tasks")
      .select("*")
      .eq("qr_code", taskCode)
      .single();

    // 🔹 3. Upload proof image
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    await supabaseClient.storage
      .from("proofs")
      .upload(filePath, file);

    const proofUrl = filePath;

    // 🔹 4. Save submission
    const { data: submission } = await supabaseClient
      .from("submissions")
      .insert([{
        user_id: user.id,
        task_id: task.id,
        proof_url: proofUrl,
        points_awarded: task.points,
        place_visited: place,
        knowledge: knowledge
      }])
      .select()
      .single();

    // 🔹 5. Update points
    const newPoints = user.points + task.points;

    await supabaseClient.from("users").update({
      points: newPoints
    }).eq("id", user.id);

    alert("🔥 Submission successful! Points awarded!");

  } catch (error) {
    console.error("FULL ERROR:", error);
alert(error.message);
  }
      }
