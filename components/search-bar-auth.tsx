"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

type SearchBarAuthProps = {
  onSearch: (query: string, language: string, difficulty: string, outputType: "playlist" | "document") => void;
  outputType: "playlist" | "document";
  onOutputTypeChange: (value: "playlist" | "document") => void;
  isLoading?: boolean;
  [key: string]: any;
};

export function SearchBarAuth(props: SearchBarAuthProps) {
  const { status } = useSession();
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (query: string, language: string, difficulty: string, outputType: "playlist" | "document") => {
    if (status !== "authenticated") {
      setError("You must be signed in to search.");
      router.push("/auth/signin");
      return;
    }
    setError("");
    props.onSearch(query, language, difficulty, outputType);
  };

  if (!isMounted) {
    return <SearchBar {...props} onSearch={handleSearch} />;
  }

  return (
    <>
      <SearchBar {...props} onSearch={handleSearch} />
      {error && (
        <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
      )}
    </>
  );
}
