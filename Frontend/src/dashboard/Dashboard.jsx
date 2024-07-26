import axios from "axios";
import DashHeader from "./components/DashHeader";
import DashUserData from "./components/DashUserData";
import { useState } from "react";
import { useMutation } from "react-query";
import { motion } from "framer-motion";
import Loading from "../components/Loading";
import { useAuth } from "./Auth";

export default function Dashboard() {
  const { user, setUser } = useAuth();

  const [filter, setFilter] = useState("all");
  const [logInfo, setLogInfo] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);

  const loginMutation = useMutation(
    async () => {
      const { data } = await axios.post("/api/v1/users/login", logInfo);
      return data.data;
    },
    {
      onSuccess: (data) => {
        setUser(data);
        setLogInfo({ username: "", password: "" });
        localStorage.setItem("user", JSON.stringify(data));
      },
      onError: (error) => {
        setError("Login failed. Please check your credentials and try again.");
        console.error(error?.response.data.message);
      },
    }
  );

  return (
    <section className="width padding-x padding-y flex gap-3 h-screen">
      <section
        className="w-[18rem] shrink-0 bg-gray-200
       rounded-xl my-3 px-5 py-12 flex items-center justify-center text-center"
      >
        <section className="flex flex-col items-center justify-center gap-3">
          <h3 className="text-3xl font-thin text-gray-600">Log in</h3>
          <input
            onChange={(e) =>
              setLogInfo((prev) => ({ ...prev, username: e.target.value }))
            }
            className="py-2 px-3 rounded-lg"
            type="text"
            value={logInfo.username}
            placeholder="username or email"
          />
          <input
            onChange={(e) =>
              setLogInfo((prev) => ({ ...prev, password: e.target.value }))
            }
            className="py-2 px-3 rounded-lg"
            type="password"
            value={logInfo.password}
            placeholder="password"
          />
          {error && <p className="text-red-500">{error}</p>}
          {loginMutation.isLoading ? (
            <Loading clName={"h-full w-full"} />
          ) : (
            <motion.input
              onClick={() => {
                setError(null); // Clear any previous error
                loginMutation.mutate();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              className="py-2 px-3 rounded-lg bg-white w-full text-gray-600 "
              type="button"
              value="Log in"
            />
          )}
        </section>
      </section>

      {/* Main section */}
      <main className="w-full">
        <DashHeader filter={filter} setFilter={setFilter} />
        <DashUserData filter={filter} />
      </main>
    </section>
  );
}
