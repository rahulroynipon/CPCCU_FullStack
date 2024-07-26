import { motion, AnimatePresence } from "framer-motion";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useState } from "react";
import Loading from "./Loading";
import { useMutation } from "react-query";
import axios from "axios";
import { queryClient } from "./../App";

export default function Modal({ data, open, setClose }) {
  const [updateData, setUpdateData] = useState({
    role: "member",
    position: "0",
    positionName: "Member",
  });
  const [error, setError] = useState(null);

  const closeHandler = () => {
    setClose(false);
    setUpdateData({ role: "member", position: "0", positionName: "Member" });
    setError(null);
  };

  const sentUpdate = useMutation(
    async () => {
      const response = await axios.patch(
        `/api/v1/dashboard/admin/update/roles?id=${data?._id}`,
        updateData
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        setUpdateData({
          role: "member",
          position: "0",
          positionName: "Member",
        });
        queryClient.invalidateQueries("users");
        closeHandler();
        console.log("Update successful", data);
      },
      onError: (error) => {
        setError("Update failed. Please try again.");
        console.error("Update failed", error);
      },
    }
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center backdrop-blur"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative bg-white rounded-xl shadow-xl border p-6"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={closeHandler}
              className="absolute right-5 top-3 opacity-70"
            >
              <IoIosCloseCircleOutline size={28} />
            </motion.button>

            {/* Main Section */}
            <main>
              <section className="w-full gap-1 flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-full overflow-hidden">
                  <img className="object-cover" src={data?.avatar} alt="" />
                </div>
                <h4 className="font-semibold">{data?.fullname}</h4>
              </section>

              <section className="mt-5">
                <table className="w-full text-left text-black/80">
                  <thead className="border-b">
                    <tr>
                      <th className="pr-2 py-1">Role</th>
                      <th className="px-3 py-1">Position</th>
                      <th className="px-2 py-1">Position Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="pr-2 py-1">{data?.roles.role}</td>
                      <td className="px-3 py-1 text-center">
                        {data?.roles.position}
                      </td>
                      <td className="px-2 py-1">{data?.roles.positionName}</td>
                    </tr>

                    <tr>
                      <td>
                        <select
                          onChange={(e) =>
                            setUpdateData((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))
                          }
                          className="py-1 my-1 shadow-inner bg-gray-100 rounded"
                          value={updateData.role}
                        >
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="mentor">Mentor</option>
                          <option value="member">Member</option>
                        </select>
                      </td>

                      <td className="text-center">
                        <input
                          onChange={(e) =>
                            setUpdateData((prev) => ({
                              ...prev,
                              position: e.target.value,
                            }))
                          }
                          className="w-12 border px-2 shadow-inner bg-gray-100 rounded"
                          type="text"
                          value={updateData.position}
                        />
                      </td>

                      <td className="px-2">
                        <input
                          onChange={(e) =>
                            setUpdateData((prev) => ({
                              ...prev,
                              positionName: e.target.value,
                            }))
                          }
                          className="w-32 border px-2 shadow-inner bg-gray-100 rounded"
                          type="text"
                          value={updateData.positionName}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <section className="flex items-center justify-center mt-7">
                  {sentUpdate.isLoading ? (
                    <Loading clName={"h-full w-full"} />
                  ) : (
                    <motion.button
                      onClick={() => sentUpdate.mutate()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="border px-3 py-1 bg-green-600 text-white rounded-lg"
                    >
                      Update
                    </motion.button>
                  )}
                </section>
                {error && <p className="text-red-500 mt-3">{error}</p>}
              </section>
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
