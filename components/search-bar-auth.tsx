"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

type SearchBarAuthProps = {
  onSearch: (query: string, language: string, difficulty: string) => void;
  [key: string]: any;
};

export function SearchBarAuth(props: SearchBarAuthProps) {
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = (query: string, language: string, difficulty: string) => {
    if (status !== "authenticated") {
      setError("You must be signed in to search.");
      router.push("/auth/signin");
      return;
    }
    setError("");
    props.onSearch(query, language, difficulty);
  };

  return (
    <>
      <SearchBar {...props} onSearch={handleSearch} />
      {error && (
        <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
      )}
    </>
  );
}
