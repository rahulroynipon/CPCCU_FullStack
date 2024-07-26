import axios from "axios";
import { useQuery } from "react-query";
import { Loading } from "./../../components/GlobalComponent";
import { motion } from "framer-motion";
import { useState } from "react";
import Modal from "../../components/Modal";

export default function DashUserData({ filter }) {
  const [open, setClose] = useState(false);
  const [userData, setUserData] = useState(null);

  const modalHandler = (item) => {
    setUserData(item);
    setClose(true);
  };

  const fetchData = async () => {
    const { data } = await axios.get(`/api/v1/users/info?role=${filter}`);
    return data;
  };

  const { data, isError, error, isLoading } = useQuery(
    ["users", filter],
    fetchData
  );

  if (isLoading) return <Loading />;
  if (isError) return <div>{error?.response.data}</div>;

  return (
    <main className="px-5 py-5">
      <table className="w-full text-left text-gray-600">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-2">Index</th>
            <th className="px-2 py-2">User Detail</th>
            <th className="px-2 py-2">Role</th>
            <th className="px-2 py-2">Position</th>
            <th className="px-2 py-2">Position Name</th>
            <th className="px-2 py-2">Edit</th>
          </tr>
        </thead>

        {data.data.length ? (
          <tbody>
            {data?.data?.map((item, index) => (
              <tr
                key={item?._id}
                className={`${
                  index % 2 === 0 ? "bg-black/5" : ""
                } border-b py-2 hover:bg-gray-200 transition-all duration-300`}
              >
                <td className="px-2 py-2">{index + 1}</td>
                <td className="flex gap-1 items-center justify-start px-2 py-2">
                  <div className="h-8 w-8 bg-red-200 rounded-full overflow-hidden object-cover">
                    <img src={item?.avatar} alt="avatar" />
                  </div>
                  <p className="font-semibold">{item?.fullname}</p>
                </td>
                <td className="px-2 py-2">{item?.roles.role}</td>
                <td className="px-2 py-2">{item?.roles.position}</td>
                <td className="px-2 py-2">{item?.roles.positionName}</td>
                <td className="px-2 py-2">
                  <motion.button
                    onClick={() => modalHandler(item)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-green-600 bg-green-200 px-2 rounded-xl border shadow-inner"
                  >
                    edit
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        ) : (
          <tbody>
            <tr>
              <th>Not found</th>
            </tr>
          </tbody>
        )}
      </table>

      <Modal data={userData} setClose={setClose} open={open} />
    </main>
  );
}
