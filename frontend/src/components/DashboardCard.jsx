function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        width: "220px",
        borderRadius: "10px",
      }}
    >
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

export default DashboardCard;