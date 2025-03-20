import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 800 },
  { name: "Mar", users: 600 },
  { name: "Apr", users: 1200 },
];

const ChartComponent = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="users" stroke="#E65100" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ChartComponent;
