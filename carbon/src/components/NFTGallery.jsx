export default function NFTGallery({ nfts }) {
  if (!nfts || nfts.length === 0) {
    return <p className="text-gray-500 text-center mt-6">No NFTs minted yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {nfts.map((nft, i) => (
        <div key={i} className="border rounded-lg p-4 shadow-md bg-white">
          <img src={nft.image} alt={nft.name} className="rounded-lg w-full h-40 object-cover" />
          <h3 className="mt-2 font-bold">{nft.name}</h3>
          <p className="text-sm text-gray-600">Credits: {nft.credits}</p>
        </div>
      ))}
    </div>
  );
}
