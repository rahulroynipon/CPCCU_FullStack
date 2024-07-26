import axios from "axios";
import { ShortProfileIcon } from "./../../components/GlobalComponent";
import { useAuth } from "./../Auth";
import { useMutation, useQuery } from "react-query";

export default function DashHeader({ filter, setFilter }) {
  const { user, setUser } = useAuth();

  const data = localStorage.getItem("user");

  if (!user && data) {
    setUser(JSON.parse(data));
  }

  const logOut = async () => {};

  const LogOut = useMutation(
    async () => {
      const { data } = await axios.post("/api/v1/users/logout");
      return data.data;
    },
    {
      onSuccess: (data) => {
        setUser(null);
        localStorage.removeItem("user");
      },
    }
  );

  return (
    <>
      <header className="py-2 px-5 flex justify-between items-center  bg-white ">
        <div className="font-semibold text-xl text-black/70">
          User Data {">"} <span>{filter}</span>
        </div>
        <div className="flex gap-5 items-center justify-center bg-black/15 px-3 py-1 rounded shadow-inner">
          <ShortProfileIcon data={user} />
          <div className="h-6 w-[1.2px] bg-black/30"></div>
          <button onClick={() => LogOut.mutate()}>Logout</button>
        </div>
      </header>

      <section className="px-5">
        <select
          onClick={(e) => setFilter(e.target.value)}
          className="border px-2 py-2 rounded-md bg-gray-200"
          name="filter"
          id="filter"
        >
          {option?.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>
    </>
  );
}

export const option = ["all", "admin", "moderator", "mentor", "member"];
