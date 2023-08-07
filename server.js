const express = require("express");
const cors = require("cors");
const { default: axios } = require("axios");
const https = require("https");
const FormData = require("form-data");
const jsdom = require("jsdom");
const _ = require("lodash");
const stations = require("./utilities/stations");

const app = express();
const port = 3001;
const { JSDOM } = jsdom;

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
    next();
});

app.post("/transjakarta/operators", async (req, res) => {
    const bodyData = { ...req.body };

    var formData = new FormData();
    formData.append("kode", bodyData?.kode);
    formData.append("order", bodyData?.order);
    formData.append("order2", bodyData?.order2);
    formData.append("order3", bodyData?.order3);
    formData.append("submit", bodyData?.submit);

    // try {
    // 	const resp = await axios
    // 		.post(
    // 			'https://gps-monitoring.transjakarta.co.id/cek_status_gps_per_operator.php',
    // 			formData,
    // 			{
    // 				// withCredentials: true,
    // 				httpsAgent,
    // 				// headers: {
    // 				// 	Cookie: 'cookiesession1=678A8C54WXYZABCDEFGHIJKLMNOPB531',
    // 				// },
    // 			}
    // 		)
    // 		.then((res) => console.log(res));
    // } catch (err) {
    // 	console.error(err.response.data);
    // }

    let config = {
        method: "post",
        maxBodyLength: Infinity,
        httpsAgent,
        url: "https://gps-monitoring.transjakarta.co.id/cek_status_gps_per_operator.php",
        headers: {
            Cookie: "cookiesession1=678A8C54WXYZABCDEFGHIJKLMNOPB531",
            ...formData.getHeaders(),
        },
        data: formData,
    };

    await axios
        .request(config)
        .then((response) => {
            res.status(200).json(response.data);
        })
        .catch((error) => {
            console.log(error);
        });
});

app.get("/kci/krl-d1", async (req, res) => {
    const getTrainDetail = async (nokaArray) => {
        const promises = nokaArray.map((noka) => {
            return axios.post(
                "https://access.kci.id/api/v1/gateway/access/train/schedule-code",
                { train_no: noka }
            );
        });

        try {
            const responses = await Promise.all(promises);
            return responses.map((response) => response.data);
        } catch (error) {
            console.error("Error making API requests:", error.message);
            return [];
        }
    };

    try {
        const locationAPI = await axios.get(
            "http://info.krl.co.id/tracking/gettrain"
        );

        const trainLocation = locationAPI.data;
        const noka = _.map(trainLocation, "noka");
        const trainDetailData = await getTrainDetail(noka);

        res.status(200).json({
            location: trainLocation,
            detail: trainDetailData,
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

app.post("/kci/station-timetable", async (req, res) => {
    const bodyData = { ...req.body };

    const stationTimetable = await axios.post(
        "https://access.kci.id/api/v1/gateway/access/train/realtime",
        bodyData
    );

    res.status(200).json(stationTimetable.data);
});

app.get("/kci/stations", (req, res) => {
    res.status(200).json(stations);
});

app.listen(port, () => console.log(`http://localhost:${port}/`));
