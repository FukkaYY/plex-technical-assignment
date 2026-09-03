"use client";
import { useParams } from "next/navigation";
import GroupChat from "@/components/group-chat";
export default function CompanyGroupPage() { const { id } = useParams<{ id: string }>(); return <GroupChat id={id} role="company" />; }
