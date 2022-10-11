const { BeanModel } = require("redbean-node/dist/bean-model");
const { R } = require("redbean-node");
const dayjs = require("dayjs");
const { log, utcToLocal, SQL_DATETIME_FORMAT_WITHOUT_SECOND } = require("../../src/util");
const { UptimeKumaServer } = require("../uptime-kuma-server");

class MaintenanceTimeslot extends BeanModel {

    async toPublicJSON() {
        const serverTimezoneOffset = UptimeKumaServer.getInstance().getTimezoneOffset();

        const obj = {
            id: this.id,
            startDate: this.start_date,
            endDate: this.end_date,
            startDateServerTimezone: utcToLocal(this.start_date, SQL_DATETIME_FORMAT_WITHOUT_SECOND),
            endDateServerTimezone: utcToLocal(this.end_date, SQL_DATETIME_FORMAT_WITHOUT_SECOND),
            serverTimezoneOffset,
        };

        return obj;
    }

    async toJSON() {
        return await this.toPublicJSON();
    }

    /**
     *
     * @param {Maintenance} maintenance
     * @param {dayjs} startFrom (For recurring type only) Generate Timeslot from this date, if it is smaller than the current date, it will use the current date instead. As generating a passed timeslot is meaningless.
     * @param {boolean} removeExist Remove existing timeslot before create
     * @returns {Promise<void>}
     */
    static async generateTimeslot(maintenance, startFrom = null, removeExist = false) {
        if (!startFrom) {
            startFrom = dayjs();
        }

        if (removeExist) {
            await R.exec("DELETE FROM maintenance_timeslot WHERE maintenance_id = ? ", [
                maintenance.id
            ]);
        }

        if (maintenance.strategy === "manual") {
            log.debug("maintenance", "No need to generate timeslot for manual type");
        } else if (maintenance.strategy === "single") {
            let bean = R.dispense("maintenance_timeslot");
            bean.maintenance_id = maintenance.id;
            bean.start_date = maintenance.start_date;
            bean.end_date = maintenance.end_date;
            bean.generated_next = true;
            await R.store(bean);
        } else if (maintenance.strategy === "recurring-interval") {
            // TODO
        } else if (maintenance.strategy === "recurring-weekday") {
            // TODO
        } else if (maintenance.strategy === "recurring-day-of-month") {
            // TODO
        } else {
            throw new Error("Unknown maintenance strategy");
        }
    }
}

module.exports = MaintenanceTimeslot;
