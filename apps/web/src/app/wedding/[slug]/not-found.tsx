import Link from "next/link";

/* Unknown slug or an unpublished draft: the public can't tell which, by design */
export default function WeddingInvitationNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed] px-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="font-moul text-xl text-[#7a4d0c] leading-loose">រកមិនឃើញលិខិតអញ្ជើញ</p>
        <h1 className="text-lg font-semibold text-[#2b2520]">This invitation isn&apos;t available</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          សូមពិនិត្យ Link ម្តងទៀត ឬសួរគូស្វាមីភរិយាថាតើធៀបការបានផ្សព្វផ្សាយហើយឬនៅ។
          <br />
          Please check the link, or ask the couple whether the invitation has been published.
        </p>
        <Link href="/wedding" className="inline-flex h-10 items-center px-5 rounded-xl bg-[#2b2520] text-[#fbf7ef] text-sm">
          CamTech Wedding
        </Link>
      </div>
    </div>
  );
}
