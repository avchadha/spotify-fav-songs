// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQDsGA-DLPT0Qy1L37DFxWQ7MC6u2PVZbY_xV13NmKnevkucvqnx2fphDKteE9ofrOYgGq6X0_jKIxMNEM7qASvRzCN_jKIhyJ_PgpJcq0RkV7Pm9DTEFiELgnUqhlNdBQynPSptDhg6-XUqhs0ZuEDMBd7I1piLvKFJIG6QQ3Ij6p-lA8SI4m4kw_XeCh7erRstCdgc5Er2aqTJjBmlq1quHj5q0kmHcAq9HV29dTe1e-EM2hIDQyuRsxkDZovsjIUz_3JvRpfz6xAuWtNtZTdnMK64Gw2lomGScOkfFoC8s-tD0TWBLPtM';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({name, artists}) =>
      `${name} by ${artists.map(artist => artist.name).join(', ')}`
  )
);